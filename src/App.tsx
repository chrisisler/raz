import React, { useState } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'

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
          <li
            className="App-media-item"
            key={imdbID}
            onClick={async (): Promise<void> => {
              let endpoint = createUrl(`&i=${imdbID}&type=${Type}`)
              try {
                let data: FullContent = await cached(imdbID, async () => {
                  return (await fetch(endpoint)).json()
                })
                console.log('data is:', data)
              } catch (error) {
                console.error('Error:', error.message)
              }
            }}
          >
            <div>
              <strong>{Title}</strong>
            </div>
            {Year}
          </li>
        )
      })}
    </ul>
  )
}

export default function App(): JSX.Element {
  let [movies, setMovies] = useState<Content[]>([])
  let [serieses, setSerieses] = useState<Content[]>([])
  let [episodes, setEpisodes] = useState<Content[]>([])
  let [display, setDisplay] = useState<boolean>(
    movies.length === 0 && serieses.length === 0 && episodes.length === 0
  )

  return (
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
          let searched: string = event.currentTarget.value
          if (key === 'Enter') {
            try {
              let endpoint = createUrl(`&s=${searched}`)
              let data: SearchResponse = await cached('search', async () => {
                return (await fetch(endpoint)).json()
              })
              let newSeries: Content[] = []
              let newMovies: Content[] = []
              let newEpisodes: Content[] = []
              data.Search.forEach((result: Content) => {
                if (result.Type === Format.Series) newSeries.push(result)
                else if (result.Type === Format.Movie) newMovies.push(result)
                else newEpisodes.push(result)
              })
              setSerieses(newSeries)
              setMovies(newMovies)
              setEpisodes(newEpisodes)
              console.log('data is:', data)
            } catch (error) {
              console.error('Error:', error.message)
            }
          }
        }}
      />
      {display && (
        <>
          <ContentContainer contents={movies} format={Format.Movie} />
          <ContentContainer contents={serieses} format={Format.Series} />
          <ContentContainer contents={episodes} format={Format.Episode} />
        </>
      )}
    </main>
  )
}
