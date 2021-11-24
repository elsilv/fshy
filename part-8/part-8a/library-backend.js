const { createServer } = require("http");
const express = require("express");
const cors = require('cors')
const { execute, subscribe } = require("graphql");
const { ApolloServer, gql, UserInputError, AuthenticationError } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const mongoose = require('mongoose');

const Book = require('./models/book');
const Author = require('./models/author');
const User = require('./models/user');

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'secret';
const MONGODB_URI = 'mongodb+srv://kissa:7xA3py17FiIpHHUL@cluster0.gvas4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
console.log('connecting to', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  });

(async () => {
  const PORT = 4000;
  const pubsub = new PubSub();
  const app = express();
  app.use(cors());
  const httpServer = createServer(app);

  var corsOptions = {
    origin: 'http://localhost:3000/',
    credentials: true ,
    allowedHeaders: ['Authorization', 'Content-Type', 'apollographql-client-name', 'Access-Control-Allow-Origin']
  };
  app.use(cors(corsOptions));

  const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  type Token {
    value: String!
  }
  type Book {
      title: String!
      published: Int!
      author: Author!
      genres: [String!]!
      id: ID!
  }
  type Author {
      name: String!
      born: Int
      id: ID!
  }
  type AuthorBookCount {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
}
  type Mutation {
      addBook(
          title: String!
          author: String
          published: Int
          genres: [String]
      ) : Book
      editAuthor(
        name: String
        setBornTo: Int
      ): Author
      createUser(
        username: String!
        favoriteGenre: String
      ): User
      login(
        username: String!
        password: String!
      ): Token
  }
  type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(author: String, genre: String): [Book]!
      allAuthors: [Author!]!
      allAuthorsWithBookCount: [AuthorBookCount!]!
      me: User
  }

  type Subscription {
    bookAdded: Book!
  }
  `;

  const resolvers = {
    Query: {
      bookCount: () => Book.collection.countDocuments(),
      authorCount: () => Author.collection.countDocuments(),
      allAuthors: async () => await Author.find(),
      allAuthorsWithBookCount: async () => await Author.find(),
      me: (root, args, context) => {
        return context.currentUser
      },
      
      allBooks: async (root, args) => {
        const books = await Book.find()

            if(!args.author && !args.genre) return books;

            const authorFilter = books.filter(book => book.author.name === args.author)
            const genreFilter  = books.filter(book => book.genres.includes(args.genre))

            if(!args.author) {return genreFilter}
            if(!args.genre)  {return authorFilter}
            return authorFilter && genreFilter
         
      }
    },
    AuthorBookCount: {
      bookCount: async (root) => {
        const books = await Book.find({ author: root.id })
        return books.lenght
      }
    },
    Book: {
      author: async (root) => {
        const author = await Author.findById(root.author)
        return {
          id: author.id,
          name: author.name,
          born: author.born
        }
      }
    },
    Mutation: {
      addBook: async (root, args, context) => {
        const author = await Author.findOne({ name: args.author })
        const currentUser = context.currentUser
        const book = new Book({ ...args })

        if(!currentUser) {
          throw new AuthenticationError("not authenticated")
        } 
  
        if (!author) {
          author = await new Author({ name: args.author  }).save()
        }
  
        try {
           await book.save()
           await currentUser.save() 
        } catch(error) {
            throw new UserInputError(error.message, {
            invalidArgs: args
          })
        }
  
          pubsub.publish('BOOK_ADDED', { bookAdded: book })
          return book
        },

        editAuthor: async (root, args, context) => {
          let author = await Author.findOne({ name: args.name })

          if(!currentUser) {
            throw new AuthenticationError("not authenticated")
          }
    
          if (!author) {
            throw new UserInputError('No user found')
          }

          try {
            author.born = args.setBornTo
            await author.save() 
          } catch(error) {
              throw new UserInputError(error.message, {
                invalidArgs: args
              })
            }
          
          return author
    },

    createUser: async (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      try {
        return user.save()
      }
      catch(error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new UserInputError("Wrong credentials")
      }

      const userForToken = {
        username: user.username,
        id: user._id
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]),
    },
  },
  };

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null
      if(auth && auth.toLowerCase().startsWith('bearer ')) {
        const decodedToken = jwt.verify(
          auth.substring(7), JWT_SECRET
        )
        const currentUser = await User.findById(decodedToken.id)
        return { currentUser }
      }
    }
  });
  await server.start();
  server.applyMiddleware({ app, cors: true });

  SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: server.graphqlPath }
  );

  httpServer.listen(PORT, () => {
    console.log(`Server ready at localhost:${PORT}`);
    console.log(`Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });

})();