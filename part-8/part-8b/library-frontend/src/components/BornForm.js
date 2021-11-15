import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'

import { EDIT_AUTHOR, ALL_AUTHORS } from '../queries'

const BornForm = () => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [ changeBorn ] = useMutation(EDIT_AUTHOR)

  const result = useQuery(ALL_AUTHORS, {
    pollInterval: 2000
  })

  const submit = async (event) => {
    event.preventDefault()
    changeBorn({ variables: { name, born: born.length > 0 ? born : null } })

    setName('')
    setBorn('')
  }

  return (
    <div>
    <h2>Set birthyear</h2>
    <form onSubmit={submit}>
    <select value={name} onChange={({target}) => setName(target.value)}> 
    {result.data.allAuthors.map(a =>
            <option value={a.name}>{a.name}</option>
          )}
    </select>
      <div>
        born <input 
          value={born} 
          onChange={({target}) => setBorn(Number(target.value))} />
      </div>
      <button type='submit'>update author</button>
    </form>
  </div>
  )
}

export default BornForm