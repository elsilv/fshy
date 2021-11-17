
import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'

const Books = (props) => {
  const [genre, setGenre] = useState(null)
  const result = useQuery(ALL_BOOKS, {
    pollInterval: 2000
  })

  const variableResult = useQuery(ALL_BOOKS, {
    refetchQueries: [ {query: ALL_BOOKS, variables: { genre: genre }}]
  })


  if(result.loading) {
    return (<div>loading...</div>)
  }

  if (!props.show) {
    return null
  }

  var genreArray = variableResult.data.allBooks.map(a => a.genres)
  var filteredGenres = genreArray.flat().filter((x,y) => !genreArray.flat().includes(x, y+1))

  var filteredBooks = result.data.allBooks.filter(a => a.genres.includes(genre))

  return (
    <div>
      <h2>books</h2>

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

      <h2>By genre</h2>

    {filteredGenres.map(a =>
        <button value={a} onClick={() => setGenre(a)}>{a}</button>
    )}
  
  <p></p>
    </div>
  )
}

export default Books