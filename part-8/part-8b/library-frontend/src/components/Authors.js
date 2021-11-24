import React from 'react'
import { useQuery } from '@apollo/client'
import { ALL_AUTHORS_BOOKCOUNT } from '../queries'
import BornForm from './BornForm'

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS_BOOKCOUNT, {
    pollInterval: 2000
  })
  
  if(result.loading) {
    return (<div>loading...</div>)
  }
  
  if (!props.show) {
    return null
  }

  if (!result.data) {
    return (<div>data missing...</div>)
  }


  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {result.data.allAuthorsWithBookCount.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>

      <BornForm />
    </div>
  )
}

export default Authors