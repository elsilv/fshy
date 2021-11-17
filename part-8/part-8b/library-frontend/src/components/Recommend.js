import React from 'react'
import { useQuery } from '@apollo/client'
import { CURRENT_USER, ALL_BOOKS } from '../queries'

const Recommend = (props) => {
  const result = useQuery(CURRENT_USER, {
    pollInterval: 2000
  })

  const bookResult = useQuery(ALL_BOOKS)

  if(result.loading) {
    return (<div>loading...</div>)
  }
  
  if (!props.show) {
    return null
  }

  if (!result.data) {
    return (<div>data missing...</div>)
  }

  var genre = result.data.me.favoriteGenre
  var filteredBooks = bookResult.data.allBooks.filter(a => a.genres.includes(genre))

  return (
    <div>
      <h2>recommendations</h2>
      <p>books in your favorite genre: <b>{result.data.me.favoriteGenre}</b></p>

      <table>
        <tbody>
          <tr>
            <th>
              title
            </th>
            <th>
              author
            </th>
            <th>
              published
            </th>
            <th>
              genres
            </th>
          </tr>
          {filteredBooks.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
              <td>{a.genres.map(a => <td>{a}</td>)}</td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  )
}

export default Recommend