import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { authEndpoint, clientId, redirectUri, scopes } from './config';
import hash from './hash';
import './App.css';

function App() {
	const [token, setToken] = useState('');
	const [playlists, setPlaylists] = useState([]);
	const [songs, setSongs] = useState([]);
	const [selectedPlaylist, setSelectedPlaylist] = useState(null);

	useEffect(() => {
		let _token = hash.access_token;
		if (_token) {
			setToken(_token);
			localStorage.setItem('spotifyToken', _token);
		} else {
			_token = localStorage.getItem('spotifyToken');
			if (_token) setToken(_token);
		}
	}, []);

	useEffect(() => {
		if (token) {
			axios
				.get('https://api.spotify.com/v1/me/playlists', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				.then((response) => {
					setPlaylists(response.data.items);
				});
		}
	}, [token]);

	const fetchSongs = (playlistId) => {
		axios
			.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			.then((response) => {
				setSongs(response.data.items);
				setSelectedPlaylist(playlistId);
			});
	};

	const handleLogout = () => {
		setToken('');
		setPlaylists([]);
		setSongs([]);
		setSelectedPlaylist(null);
		localStorage.removeItem('spotifyToken');
	};

	return (
		<div className="App">
			{!token && (
				<a
					className="btn btn--loginApp-link"
					href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`}
				>
					Login to Spotify
				</a>
			)}
			{token && (
				<div>
					<button onClick={handleLogout} className="btn btn--logout">
						Log Out
					</button>
					<h1>Your Playlists</h1>
					<ul>
						{playlists.map((playlist) => (
							<li key={playlist.id} onClick={() => fetchSongs(playlist.id)}>
								{playlist.name}
							</li>
						))}
					</ul>
					{selectedPlaylist && (
						<div>
							<h2>Songs in Playlist</h2>
							<ul>
								{songs.map((song, index) => (
									<li key={index}>
										{song.track.name} by {song.track.artists.map(artist => artist.name).join(', ')}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default App;
