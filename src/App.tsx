import React, { useRef, useState, ReactNode, useEffect } from 'react'
import { BrowserRouter, Route, Link, RouteComponentProps } from 'react-router-dom'

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

type SearchResponse = {
  totalResults: string
  Response: 'False' | 'True'
  Search: Array<Content>
}

type ErrorResponse = {
  Error: string
  Response: 'False' | 'True'
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

// (A, [B, B, B, ...])) -> [B, A, B, A, B, ..., B]
const interleave = (item: any, [first, ...rest]: any[]): any[] => {
  if (first === void 0) {
    return [item]
  }
  let interleavedRest = rest.reduce((acc, x) => acc.concat(item, x), [])
  let result = [first].concat(interleavedRest)
  return result
}

const valid = (data: string): boolean => !data.toLowerCase().includes('n/a')

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

function FullContentView(props: any): JSX.Element {
  let [loading, setLoading] = useState<boolean>(true)
  let [data, setData] = useState<FullContent | null>(null)
  let [error, setError] = useState<Error | null>(null)
  let { imdbID, type } = props.match.params
  useEffect(() => {
    let cancelled = false
    async function effect(): Promise<void> {
      try {
        let data: FullContent | ErrorResponse = await cached(imdbID, async () => {
          let endpoint = createUrl(`&i=${imdbID}&type=${type}`)
          return (await fetch(endpoint)).json()
        })
        if (!cancelled) {
          if ((data as ErrorResponse).Error) {
            throw Error((data as ErrorResponse).Error)
          }
          setData(data as FullContent)
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
  } else if (data) {
    let { imdbRating, imdbID, Title, Year, Rated, Runtime, Genre, Director, Writer, Awards } = data
    props.actions.setMessage(`IMDB ID: ${imdbID}`)
    return (
      <div className="App-full-content-container">
        <div style={{ width: 'fit-content' }}>
          <h1 className="App-full-content-title">{Title}</h1>
          <small>{+imdbRating}/10</small>
        </div>
        <div>
          <strong>
            {Year} {Genre}
          </strong>
          &nbsp; {Rated}
          {valid(Writer) && (
            <div>
              Written by{' '}
              {interleave(
                ', ',
                Writer.split(', ').map(writer => (
                  <span
                    key={writer}
                    className="App-full-content-director"
                    title={`Click to search ${writer}`}
                    onClick={() => {
                      props.actions.search(writer)
                    }}
                  >
                    {Writer}
                  </span>
                ))
              )}
            </div>
          )}
          {valid(Director) && (
            <div>
              Directed by{' '}
              {interleave(
                ', ',
                Director.split(', ').map(director => (
                  <span
                    key={director}
                    className="App-full-content-director"
                    title={`Click to search ${director}`}
                    onClick={() => {
                      props.actions.search(director)
                    }}
                  >
                    {director}
                  </span>
                ))
              )}
            </div>
          )}
          {valid(Awards) && <div>{Awards.slice(0, Awards.length - 1)}</div>}
        </div>
        <div>
          Runtime: <strong>{Runtime}</strong>
        </div>
      </div>
    )
  } else {
    throw Error('Unreachable')
  }
}

export default function App(): JSX.Element {
  let [movies, setMovies] = useState<Content[]>([])
  let [serieses, setSerieses] = useState<Content[]>([])
  let [episodes, setEpisodes] = useState<Content[]>([])
  let [message, setMessage] = useState('')
  let [search, setSearch] = useState('')
  let inputElem = useRef(null)

  useEffect(() => {
    async function effect(): Promise<void> {
      try {
        let data: SearchResponse | ErrorResponse = await cached(search, async () => {
          let endpoint = createUrl(`&s=${search}`)
          return (await fetch(endpoint)).json()
        })
        if (data.Response === 'False') {
          setMessage('No results')
          setSerieses([])
          setMovies([])
          setEpisodes([])
        } else {
          let { Search: searchResults, totalResults } = data as SearchResponse
          setMessage(`${totalResults} results for: ${search}`)
          searchResults.forEach((result: Content) => {
            if (result.Type === Format.Series) setSerieses(_ => _.concat(result))
            else if (result.Type === Format.Movie) setMovies(_ => _.concat(result))
            else setEpisodes(_ => _.concat(result))
          })
        }
      } catch (error) {
        setMessage(error.message)
        console.error('Error:', error.message)
      }
    }
    if (search !== '') {
      effect()
      if (inputElem != null) {
        // @ts-ignore
        inputElem.current.value = search
      }
    }
  }, [search])

  return (
    <BrowserRouter>
      <main className="App">
        <header className="App-header">
          <h1>raz</h1>
        </header>
        <input
          ref={inputElem}
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
              setMessage('')
            } else if (key === 'Enter') {
              setSearch(search)
            }
          }}
        />
        {message && <small style={{ padding: '16px' }}>{message}</small>}
        <Route
          exact
          path="/"
          render={(): ReactNode => (
            <>
              {!!movies.length && <ContentContainer contents={movies} format={Format.Movie} />}
              {!!serieses.length && <ContentContainer contents={serieses} format={Format.Series} />}
              {!!episodes.length && (
                <ContentContainer contents={episodes} format={Format.Episode} />
              )}
            </>
          )}
        />
        <Route
          exact
          strict
          path="/:type/:imdbID"
          component={(routeProps: RouteComponentProps<{ type: string; imdbID: string }>) => {
            return FullContentView({
              ...routeProps,
              actions: {
                setMessage,
                search: (s: string): void => {
                  routeProps.history.push('/')
                  setSearch(s)
                }
              }
            })
          }}
        />
      </main>
    </BrowserRouter>
  )
}
