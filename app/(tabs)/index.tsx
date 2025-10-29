import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  // SafeAreaView,
  TouchableOpacity,
  Alert,
  Button, // Added Button import
  TextInput
} from 'react-native';
import axios from 'axios';
// This component from Expo Router lets us set the screen's title in the header
import { Stack } from 'expo-router';

// imported for google web login and file system access
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as FileSystem from 'expo-file-system/legacy';

// import 'dotenv/config';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';

// --- FIX: Correct import for SafeAreaView ---
import { SafeAreaView } from 'react-native-safe-area-context';

// ---
// TODO: Replace this with your Gist's "Raw" URL
// ---
const GIST_URL = process.env.EXPO_PUBLIC_GIST_URL as string;

// ---
// TODO: Replace this with the "Web Application" Client ID you just created
// ---
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID as string;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID as string;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID as string;

// --- NEW: This tells the auth service to close the browser popup when done ---
WebBrowser.maybeCompleteAuthSession();

// --- Define a Type for our movie data (for TypeScript) ---
type Movie = {
  id: string;
  title: string;
  year: string;
  genre: string[];
  description: string;
  posterUrl: string;
  fileId: string; // We'll need this for Phase 4
  Actors: string[];
};

// --- This is your main screen component ---
export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]); // Use the Movie type

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]); // This holds the *displayed* list

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [movieToDownload, setMovieToDownload] = useState<Movie | null>(null);

  // --- NEW: Set up the Google Authentication hook ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'], // Request read-only access
  });

  // This useEffect handles the *response* from the login 
  useEffect(() => {
    if (response) {
      if (response.type === 'success') {
        const { access_token } = response.params;
        setAccessToken(access_token);
        
        // After logging in, if we had a movie waiting, download it
        if (movieToDownload) {
          startDownload(movieToDownload, access_token);
          setMovieToDownload(null); // Clear the waiting movie
        }
      } else if (response.type === 'error') {
        Alert.alert('Login Failed', 'There was an error logging in. Please try again.');
        console.error('Login Error:', response.error);
      }
    }
  }, [response, movieToDownload]);
  
  // This function will fetch the movie data
  const fetchMovies = async () => {
    try {
      const response = await axios.get(GIST_URL);
      setMovies(response.data); // Store the movie array in state
      setFilteredMovies(response.data); // Initially, filtered list is the full list
    } catch (error) {
      console.error('Error fetching movie list:', error);
      // You could set an error state here to show the user
    } finally {
      setIsLoading(false); // Stop the loading spinner
    }
  };

  // This useEffect hook runs once when the app component loads
  useEffect(() => {
    fetchMovies();
  }, []); // The empty array [] means it only runs once

  // --- THIS IS THE NEW, FIXED CODE ---
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredMovies(movies); // If search is empty, show all movies
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase().trim();
      
      const newFilteredMovies = movies.filter(movie => {
        
        // Check title (safely)
        if (movie.title && typeof movie.title === 'string' && movie.title.toLowerCase().includes(lowerCaseQuery)) {
          return true;
        }

        // Check genre (safely)
        // This now handles if genre is a single string OR an array of strings
        if (Array.isArray(movie.genre) && movie.genre.some(g => typeof g === 'string' && g.toLowerCase().includes(lowerCaseQuery))) {
            return true;
        }

        if (Array.isArray(movie.Actors) && movie.Actors.some(actor => typeof actor === 'string' && actor.toLowerCase().includes(lowerCaseQuery))) {
            return true;
        }

        return false; // No match
      });
      setFilteredMovies(newFilteredMovies);
    }
  }, [searchQuery, movies]);

  // --- This is the download function (no changes) ---
  const startDownload = async (movie: Movie, token: string) => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const driveApiUrl = `https://www.googleapis.com/drive/v3/files/${movie.fileId}?alt=media`;
    const fileUri = FileSystem.documentDirectory + `${movie.title.replace(/ /g, '_')}.mp4`;
    console.log('Downloading to:', fileUri);

    const progressCallback = (downloadProgress: FileSystem.DownloadProgressData) => {
      const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
      setDownloadProgress(progress);
    };

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        driveApiUrl,
        fileUri,
        { headers: { 'Authorization': `Bearer ${token}` } },
        progressCallback
      );
      const result = await downloadResumable.downloadAsync();
      if (result) {
        console.log('Finished downloading to ', result.uri);
        Alert.alert('Download Complete', `${movie.title} has been saved to your device.`);
      }
    } catch (e) {
      console.error('Download error:', e);
      Alert.alert('Download Failed', 'Could not download the file.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // --- This is the "gate" function (no changes) ---
  const handleDownloadPress = (movie: Movie) => {
    if (isDownloading) return; 

    if (accessToken) {
      startDownload(movie, accessToken);
    } else {
      setMovieToDownload(movie);
      // --- NEW: promptAsync will open the web login ---
      promptAsync();
    }
  };

  // This component defines how each movie item looks
  // --- Movie Item Component (no changes) ---
  const MovieItem = ({ item }: { item: Movie }) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.posterUrl }} style={styles.poster} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.details}>{item.year}  ·  {item.genre.join(', ')}</Text>
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
        <Button
          title="Download"
          onPress={() => handleDownloadPress(item)}
          disabled={isDownloading}
        />
      </View>
    </View>
  );
  
  // --- Render loading spinner ---
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading Movies...</Text>
      </View>
    );
  }

  // --- Render movie list ---
  return (
    <SafeAreaView style={styles.container}>
      {/* This Stack.Screen component lets us set the title of the header bar */}
      <Stack.Screen options={{ title: 'Movie Catalog' }} />
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search movies, genres, actors..."
          value={searchQuery}
          onChangeText={setSearchQuery} // Updates the searchQuery state on every key press
        />
      </View>
      
      {isDownloading && (
        <View style={styles.downloadStatus}>
          <Text style={styles.downloadText}>Downloading... {downloadProgress.toFixed(0)}%</Text>
          <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
        </View>
      )}

      {/* --- NEW --- Point FlatList data to filteredMovies --- */}
      <FlatList
        data={filteredMovies} 
        renderItem={({ item }) => <MovieItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

// --- Add these styles ---
const styles = StyleSheet.create({
  searchContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  searchBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 6,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 18,
    color: '#141414ff',
    marginBottom: 8,
  },
  downloadStatus: {
    padding: 10,
    backgroundColor: '#eee',
  },
  downloadText: {
    textAlign: 'center',
    marginBottom: 5,
  },
  progressBar: {
    height: 5,
    backgroundColor: 'blue',
  },
});