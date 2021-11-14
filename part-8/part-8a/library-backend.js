const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'secret'

const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')

const MONGODB_URI = 'mongodb+srv://kissa:7xA3py17FiIpHHUL@cluster0.gvas4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  { 
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  { 
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },  
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

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
      author: String!
      genres: [String!]!
      id: ID!
  }

  type Author {
      name: String!
      born: Int
      bookCount: Int!
      id: ID!
  }

  type Mutation {
      addBook(
          title: String!
          author: String!
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
      me: User
  }
`

const resolvers = {
    Query: {
      bookCount: () => Book.collection.countDocuments(),
      authorCount: () => Author.collection.countDocuments(),
      allAuthors: async () => await Author.find(),
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
    Author: {
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

        if(!currentUser) {
          throw new AuthenticationError("not authenticated")
        }
  
        if (!author) {
          author = await new Author({ name: args.author }).save()
        }
  
        try {
          const book = await new Book({
            title: args.title,
            published: args.published,
            author,
            genres: args.genres
          }).save()
          await currentUser.save() 
        } catch(error) {
            throw new UserInputError(error.message, {
            invalidArgs: args
          })
        }
  
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
    }
  
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})