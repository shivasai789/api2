const express = require('express')
const {open} = require('sqlite')
const sqlite = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running...')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

//Get players API
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT
        player_id as playerId,
        player_name as playerName
    FROM 
        player_details;`
  const playerArray = await db.all(getPlayersQuery)
  response.send(playerArray)
})

//Get playerId API
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerIdQuery = `
  SELECT
    player_id as playerId,
    player_name as playerName
  FROM 
    player_details
  WHERE 
    player_id = ${playerId};`
  const player = await db.get(getPlayerIdQuery)
  response.send(player)
})

//Update playerId API
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerIdQuery = `
  UPDATE
    player_details
  SET
    player_name ="${playerName}"
  WHERE 
    player_id = ${playerId};`
  await db.run(updatePlayerIdQuery)
  response.send('Player Details Updated')
})

//Get match API
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `
  SELECT 
    match_id as matchId,
    match,
    year
  FROM 
    match_details 
  WHERE 
    match_id = ${matchId};`
  const match = await db.get(getMatchQuery)
  response.send(match)
})

//Get match by playerId API
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchIdQuery = `
  SELECT 
    match_id 
  FROM
    player_match_score 
  WHERE
    player_id = ${playerId};`
  const getMatchIdQueryResponse = await db.get(getMatchIdQuery)
  const matchId = getMatchIdQueryResponse.match_id
  const getMatchQuery = `
  SELECT 
    match_id as matchId,
    match,
    year
  FROM 
    match_details 
  WHERE 
    match_id = ${matchId};`
  const getMatchQueryResponse = await db.get(getMatchQuery)
  response.send(getMatchQueryResponse)
})

//get Players by matchId API
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayerIdQuery = `
  SELECT
	  player_details.player_id AS playerId,
	  player_details.player_name AS playerName
  FROM 
    player_match_score 
  NATURAL JOIN 
    player_details
  WHERE 
    match_id=${matchId};;`
  const getPlayerIdQueryRes = await db.all(getPlayerIdQuery)
  response.send(getPlayerIdQueryRes)
})

//get playerScores based on playerId API
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScoresquery = `
  SELECT 
    player_details.player_id as PlayerId,
    player_details.player_name as playerName,
    SUM(player_match_score.score) as totalScore,
    SUM(player_match_score.fours) as totalFours,
    SUM(player_match_score.sixes) as totalSixes
  FROM 
    player_match_score 
  INNER JOIN 
    player_details 
  ON 
  player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`
  const res = await db.get(getPlayerScoresquery)
  response.send(res)
})

module.exports = app
