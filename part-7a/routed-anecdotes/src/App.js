import React, { useState } from 'react'
import { 
  BrowserRouter as Router,
  Switch, Route, Link, useParams, useHistory, Redirect
} from 'react-router-dom' 
import { useField } from './hooks'

const AnecdoteList = ({ anecdotes }) => (
  <div>
    <h2>Anecdotes</h2>
    <ul>
      {anecdotes.map(anecdote => 
        <li key={anecdote.id}>
         <Link to={`/anecdotes/${anecdote.id}`}>{anecdote.content}</Link>
        </li>
      )}
    </ul>
  </div>
)

const Anecdote = ({ anecdotes }) => {
  const id = useParams().id
  const anecdote = anecdotes.find(n => n.id === id)

  return (
    <div>
      <h2>{anecdote.content} by {anecdote.author}</h2>
      <p></p>
      <div>has {anecdote.votes} votes</div>
      <p></p>
      <div>for more info see {anecdote.info}</div>
      <p></p>
    </div>
  )}

const About = () => (
  <div>
    <h2>About anecdote app</h2>
    <p>According to Wikipedia:</p>

    <em>An anecdote is a brief, revealing account of an individual person or an incident.
      Occasionally humorous, anecdotes differ from jokes because their primary purpose is not simply to provoke laughter but to reveal a truth more general than the brief tale itself,
      such as to characterize a person by delineating a specific quirk or trait, to communicate an abstract idea about a person, place, or thing through the concrete details of a short narrative.
      An anecdote is "a story with a point."</em>

    <p>Software engineering is full of excellent anecdotes, at this app you can find the best and add more.</p>
  </div>
)

const Footer = () => (
  <div>
    Anecdote app for <a href='https://courses.helsinki.fi/fi/tkt21009'>Full Stack -websovelluskehitys</a>.

    See <a href='https://github.com/fullstack-hy/routed-anecdotes/blob/master/src/App.js'>https://github.com/fullstack-hy2019/routed-anecdotes/blob/master/src/App.js</a> for the source code.
  </div>
)

const CreateNew = (props) => {
  const content = useField('content')
  const author = useField('author')
  const info = useField('info')

  const reset = useField()

  const history = useHistory()

  const handleSubmit = (e) => {
    e.preventDefault()
    props.addNew({
      content: content.value,
      author: author.value,
      info: info.value,
      votes: 0
    })

    history.push('/')
    
  }

  return (
    <div>
      <h2>create a new anecdote</h2>
      <form>
        <div>
          content
          <input 
           value={content.value}
           type={content.type}
           onChange={content.onChange} />
        </div>
        <div>
          author
          <input 
           value={author.value}
           type={author.type}
           onChange={author.onChange} />
        </div>
        <div>
          url for more info
          <input  
          value={info.value}
           type={info.type}
           onChange={info.onChange}
           />
        </div>
        <button onClick={handleSubmit}>create</button>
        <button onClick={reset.onReset}>reset</button>
      </form>
    </div>
  )

}

const App = () => {
  const [anecdotes, setAnecdotes] = useState([
    {
      content: 'If it hurts, do it more often',
      author: 'Jez Humble',
      info: 'https://martinfowler.com/bliki/FrequencyReducesDifficulty.html',
      votes: 0,
      id: '1'
    },
    {
      content: 'Premature optimization is the root of all evil',
      author: 'Donald Knuth',
      info: 'http://wiki.c2.com/?PrematureOptimization',
      votes: 0,
      id: '2'
    }
  ])

  const [notification, setNotification] = useState('')

  const Notification = ({ notification }) => {
    if (notification === null) {
       return null
    }

    return (
      <div>
        {notification}
      </div>
    )
  }

  const addNew = (anecdote) => {
    anecdote.id = (Math.random() * 10000).toFixed(0)
    setAnecdotes(anecdotes.concat(anecdote))
    setNotification('a new anecdote created!')
    setTimeout(() => {
      setNotification('')
    }, 10000)
    }

  const anecdoteById = (id) =>
    anecdotes.find(a => a.id === id)

  const vote = (id) => {
    const anecdote = anecdoteById(id)

    const voted = {
      ...anecdote,
      votes: anecdote.votes + 1
    }

    setAnecdotes(anecdotes.map(a => a.id === id ? voted : a))
  }

  const padding = {
    paddingRight: 5
  }

  return (
    <Router>
    <div>
      <Link style={padding} to="/">anecdotes</Link>
      <Link style={padding} to="/create">create new</Link>
      <Link style={padding} to="/about">about</Link>
    </div>

    <Switch>
      <Route path="/anecdotes/:id">
        <Anecdote anecdotes={anecdotes} />
      </Route>
      <Route path="/create">
        <CreateNew addNew={addNew} />
      </Route>
      <Route path="/about">
        <About />
      </Route>
      <Route path="/">
      <Notification notification={notification} />
        <AnecdoteList anecdotes={anecdotes} />
      </Route>
    </Switch>
    <Footer />
    </Router>
    
  )
}

export default App;