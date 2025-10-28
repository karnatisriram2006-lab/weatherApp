import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables with specific path
dotenv.config({ path: path.join(__dirname, '.env') });

// Add API key validation
if (!process.env.API_KEY) {
    console.error('ERROR: API_KEY is not defined in .env file');
    process.exit(1);
}

// Debug log (remove in production)
console.log('API Key status:', process.env.API_KEY ? 'Loaded successfully' : 'Missing');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const BASE_URL = "http://api.openweathermap.org/data/2.5";
const GEO_URL = "http://api.openweathermap.org/geo/1.0";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs", { weather: null, error: null });
});

app.post("/", async (req, res) => {
    try {
        const city = req.body.city;
        
        // First, get coordinates using geocoding API
        const geoResponse = await axios.get(`${GEO_URL}/direct?q=${city}&limit=1&appid=${API_KEY}`);
        
        if (geoResponse.data.length === 0) {
            throw new Error("City not found");
        }

        const { lat, lon } = geoResponse.data[0];
        
        // Then get weather data using coordinates
        const weatherResponse = await axios.get(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );

        const weatherData = {
            city: weatherResponse.data.name,
            country: weatherResponse.data.sys.country,
            temp: Math.round(weatherResponse.data.main.temp),
            description: weatherResponse.data.weather[0].description,
            icon: weatherResponse.data.weather[0].icon,
            feels_like: Math.round(weatherResponse.data.main.feels_like),
            humidity: weatherResponse.data.main.humidity,
            wind: weatherResponse.data.wind.speed
        };

        res.render("index.ejs", { weather: weatherData, error: null });
    } catch (error) {
        res.render("index.ejs", { 
            weather: null, 
            error: "Error fetching weather data. Please try again."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});