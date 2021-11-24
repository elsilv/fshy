import { gql } from '@apollo/client'

export const ALL_AUTHORS = gql`
query {
    allAuthors {
    name,
    born,
    id
    }
}
`

export const ALL_AUTHORS_BOOKCOUNT = gql`
query {
    allAuthorsWithBookCount {
    name,
    born,
    bookCount,
    id
    }
}
`

export const ALL_BOOKS = gql`
query {
    allBooks {
    title
    published
    id
    author {
        name
    }
    genres
    }
}
`

export const CURRENT_USER = gql`
query {
    me {
    username
    favoriteGenre
    }
}
`

export const CREATE_BOOK = gql`
 mutation createBook($title: String!, $author: String!, $published: Int, $genres: [String]) {
    addBook(
        title: $title,
        author: $author,
        published: $published,
        genres: $genres
    ) {
        title
        author {
            name
        }
        published
        genres,
        id
    }
 }
`

export const EDIT_AUTHOR = gql`
 mutation editAuthor($name: String, $born: Int) {
    editAuthor(name: $name, setBornTo: $born) {
        name
        born
        bookCount
        id
    }
 }
`

export const LOGIN = gql`
 mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
        value
    }
 }
`

const BOOK_DETAILS = gql`
fragment BookDetails on Book {
    title
    author {
      name
      born
    }
    published
    genres
    id
  }
`

export const BOOK_ADDED = gql`
subscription {
    bookAdded {
      ...BookDetails
    }
  }
${BOOK_DETAILS}
`