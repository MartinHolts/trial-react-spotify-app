import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { authEndpoint, clientId, redirectUri, scopes } from './config';
import './App.css';

const App = () => {
	const [token, setToken] = useState('');
	const [playlists, setPlaylists] = useState([]);
	const [songs, setSongs] = useState([]);
	const [selectedPlaylist, setSelectedPlaylist] = useState(null);

	useEffect(() => {
		const hash = window.location.hash;
		if (hash) {
			const _token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
			setToken(_token);
			window.localStorage.setItem('spotifyToken', _token);
			const expiryTime = new Date().getTime() + 3600 * 1000; // 1 hour
			window.localStorage.setItem('spotifyTokenExpiryTime', expiryTime);
			window.location.hash = '';
		} else {
			const storedToken = window.localStorage.getItem('spotifyToken');
			const expiryTime = window.localStorage.getItem('spotifyTokenExpiryTime');
			if (storedToken && new Date().getTime() < expiryTime) {
				setToken(storedToken);
			} else {
				handleLogout(); // Token expired or not found
			}
		}
	}, []);

	useEffect(() => {
		if (token) {
			fetchPlaylists(token);
		}
	}, [token]);

	const fetchPlaylists = (accessToken) => {
		axios.get('https://api.spotify.com/v1/me/playlists', {
			headers: {
				'Authorization': `Bearer ${accessToken}`
			}
		}).then(response => {
			setPlaylists(response.data.items);
		}).catch(error => {
			console.error('Error fetching playlists:', error.response || error);
			if (error.response && error.response.status === 403) {
				handleLogout(); // Invalid token, force re-authentication
			}
		});
	};

	const fetchSongs = (playlistId) => {
		axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		}).then(response => {
			setSongs(response.data.items);
			setSelectedPlaylist(playlistId);
		}).catch(error => {
			console.error('Error fetching songs:', error.response || error);
			if (error.response && error.response.status === 403) {
				handleLogout(); // Invalid token, force re-authentication
			}
		});
	};

	const handleLogout = () => {
		window.localStorage.removeItem('spotifyToken');
		window.localStorage.removeItem('spotifyTokenExpiryTime');
		setToken('');
		setPlaylists([]);
		setSongs([]);
		setSelectedPlaylist(null);
	};

	if (!token) {
		return (
			<div className="App">
				<a className="btn btn--loginApp-link"
					href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`}>
					Login to Spotify
				</a>
			</div>
		);
	}

	return (
		<div className="App">
			<button className="btn btn--logout" onClick={handleLogout}>
				Log Out
			</button>
			<h1>Your Playlists</h1>
			<ul>
				{playlists.map(playlist => (
					<li key={playlist.id} onClick={() => fetchSongs(playlist.id)}>
						{playlist.name}
					</li>
				))}
			</ul>
			{selectedPlaylist &&
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
			}
		</div>
	);
};

export default App;
