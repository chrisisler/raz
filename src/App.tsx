import React, { useState, ReactNode, useEffect } from 'react'
import { MemoryRouter, Route, Link, RouteComponentProps } from 'react-router-dom'

import cached from 'one-cache'
import './App.css'

enum Format {
  Movie = 'movie',
  Series = 'series',
  Episode = 'episode'
}

interface Content {
  Title: string
  Year: string
  imdbID: string
  Type: Format
  Poster: string
}

interface SearchResponse {
  totalResults: string
  Response: string
  Search: Array<Content>
}

interface FullContent extends Content {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: Array<{ Source: string; Value: string }>
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: Format
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
}

const route = (url: string): void => {
  window.history.pushState(null, '', url)
}

const createUrl = (params: string) =>
  `http://www.omdbapi.com?apikey=${process.env.REACT_APP_OMDB_API_KEY}${params}`

const ContentContainer = (props: { contents: Content[]; format: Format }) => {
  if (props.contents.length === 0) {
    return null
  }

  return (
    <ul className="App-media-container">
      <h2 className="App-media-title">{props.format}</h2>
      {props.contents.map(({ Title, Year, imdbID, Type }: Content) => {
        return (
          <Link to={`/${Type}/${imdbID}`} className="App-media-item-link" key={imdbID}>
            <li className="App-media-item">
              <div>
                <strong>{Title}</strong>
              </div>
              {Year}
            </li>
          </Link>
        )
      })}
    </ul>
  )
}

function FullContentView(
  props: RouteComponentProps<{ imdbID: string; type: string }>
): JSX.Element {
  let [loading, setLoading] = useState<boolean>(true)
  let [data, setData] = useState<FullContent | null>(null)
  let [error, setError] = useState<Error | null>(null)
  let { imdbID, type } = props.match.params
  useEffect(() => {
    let cancelled = false
    async function effect(): Promise<void> {
      try {
        let data: FullContent = await cached(imdbID, async () => {
          let endpoint = createUrl(`&i=${imdbID}&type=${type}`)
          return (await fetch(endpoint)).json()
        })
        console.log('data is:', data)
        if (!cancelled) {
          setData(data)
          setError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setError(error)
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    effect()
    return () => {
      cancelled = true
    }
  }, [imdbID, type])

  if (loading) {
    return <h1>Loading...</h1>
  } else if (error) {
    return <h1>Error</h1>
  }
  return <h1>Success: {JSON.stringify(data, null, 2)}</h1>
}

export default function App(): JSX.Element {
  let [movies, setMovies] = useState<Content[]>([])
  let [serieses, setSerieses] = useState<Content[]>([])
  let [episodes, setEpisodes] = useState<Content[]>([])
  let [display] = useState<boolean>(
    movies.length === 0 && serieses.length === 0 && episodes.length === 0
  )
  let [search, setSearch] = useState('')
  let [total, setTotal] = useState(0)

  return (
    <MemoryRouter>
      <main className="App">
        <header className="App-header">
          <h1>raz</h1>
        </header>
        <input
          type="text"
          className="App-search"
          placeholder="Find movies, shows, and people..."
          onKeyUp={async (event): Promise<void> => {
            let key: string = event.key
            let search: string = event.currentTarget.value
            if (search.length <= 1) {
              setSerieses([])
              setMovies([])
              setEpisodes([])
              setSearch('')
            } else if (key === 'Enter') {
              route('/')
              try {
                let { Search, totalResults }: SearchResponse = await cached(search, async () => {
                  let endpoint = createUrl(`&s=${search}`)
                  return (await fetch(endpoint)).json()
                })
                setSearch(search)
                setTotal(+totalResults)
                let newSeries: Content[] = []
                let newMovies: Content[] = []
                let newEpisodes: Content[] = []
                Search.forEach((result: Content) => {
                  if (result.Type === Format.Series) newSeries.push(result)
                  else if (result.Type === Format.Movie) newMovies.push(result)
                  else newEpisodes.push(result)
                })
                setSerieses(newSeries)
                setMovies(newMovies)
                setEpisodes(newEpisodes)
              } catch (error) {
                console.error('Error:', error.message)
              }
            }
          }}
        />
        {search && (
          <small style={{ padding: '24px' }}>
            {total} results for: {search}
          </small>
        )}
        <Route
          exact
          path="/"
          render={(): ReactNode =>
            display && (
              <>
                <ContentContainer contents={movies} format={Format.Movie} />
                <ContentContainer contents={serieses} format={Format.Series} />
                <ContentContainer contents={episodes} format={Format.Episode} />
              </>
            )
          }
        />
        <Route exact path="/:type/:imdbID" component={FullContentView} />
      </main>
    </MemoryRouter>
  )
}
