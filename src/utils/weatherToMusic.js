export const getMusicRecommendations = (weatherCondition, temperature) => {
    const mappings = {
        'Clear': {
            mood: 'Upbeat & Happy',
            genres: ['pop', 'dance', 'indie pop'],
            description: 'Sunny vibes for clear skies!',
            emoji: '☀️'
        },
        'Clouds': {
            mood: 'Mellow & Chill',
            genres: ['indie', 'acoustic', 'lo-fi'],
            description: 'Perfect cloudy day tunes',
            emoji: '☁️'
        },
        'Rain': {
            mood: 'Cozy & Relaxing',
            genres: ['jazz', 'ambient', 'acoustic'],
            description: 'Rainy day relaxation',
            emoji: '🌧️'
        },
        'Snow': {
            mood: 'Warm & Cozy',
            genres: ['folk', 'holiday', 'acoustic'],
            description: 'Snowy day warmth',
            emoji: '❄️'
        },
        'Thunderstorm': {
            mood: 'Intense & Powerful',
            genres: ['rock', 'metal', 'electronic'],
            description: 'Stormy energy',
            emoji: '⛈️'
        },
        'Drizzle': {
            mood: 'Calm & Reflective',
            genres: ['piano', 'classical', 'soft rock'],
            description: 'Gentle drizzle melodies',
            emoji: '🌦️'
        }
    };

    let tempAdjustment = '';
    if (temperature > 30) tempAdjustment = ' 🥵 Tropical beats';
    else if (temperature < 0) tempAdjustment = ' 🧣 Cozy winter tunes';

    const base = mappings[weatherCondition] || {
        mood: 'Mixed Vibes',
        genres: ['pop', 'chill'],
        description: 'General playlist',
        emoji: '🎵'
    };

    return {
        ...base,
        description: base.description + tempAdjustment
    };
};

export const mockPlaylists = {
    'Clear': [
        { id: 1, title: 'Sunny Day Pop', tracks: 15, duration: '45 min' },
        { id: 2, title: 'Beach Vibes', tracks: 12, duration: '38 min' },
    ],
    'Clouds': [
        { id: 3, title: 'Cloudy Day Chill', tracks: 10, duration: '32 min' },
        { id: 4, title: 'Indie Cloud', tracks: 8, duration: '28 min' },
    ],
    'Rain': [
        { id: 5, title: 'Rainy Day Jazz', tracks: 20, duration: '60 min' },
        { id: 6, title: 'Stormy Nights', tracks: 12, duration: '40 min' },
    ],
};