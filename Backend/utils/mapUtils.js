// mapUtils.js - Utility functions for map and location services

class MapUtils {
    constructor() {
        this.googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        this.defaultCenter = { lat: 13.7563, lng: 100.5018 }; // Bangkok
        this.defaultZoom = 12;
        this.markers = new Map();
        this.infoWindows = new Map();
    }

    // Initialize Google Maps
    async initializeGoogleMaps() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;

            script.onload = () => resolve(window.google.maps);
            script.onerror = () => reject(new Error('Failed to load Google Maps'));

            document.head.appendChild(script);
        });
    }

    // Create map instance
    createMap(elementId, options = {}) {
        const mapOptions = {
            center: options.center || this.defaultCenter,
            zoom: options.zoom || this.defaultZoom,
            disableDefaultUI: options.disableDefaultUI || false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: this.getMapStyles(),
            ...options,
        };

        return new window.google.maps.Map(
            document.getElementById(elementId),
            mapOptions
        );
    }

    // Get current location
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    }

    // Calculate distance between two points
    calculateDistance(point1, point2) {
        const rad = (x) => (x * Math.PI) / 180;
        const R = 6371; // Earth's radius in km
        
        const dLat = rad(point2.lat - point1.lat);
        const dLng = rad(point2.lng - point1.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(point1.lat)) * Math.cos(rad(point2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    // Search nearby gyms/fitness centers
    async searchNearbyGyms(location, radius = 5000, keyword = '') {
        await this.initializeGoogleMaps();
        
        return new Promise((resolve, reject) => {
            const service = new window.google.maps.places.PlacesService(
                document.createElement('div')
            );

            const request = {
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius: radius,
                type: ['gym'],
                keyword: keyword,
            };

            service.nearbySearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    const gyms = results.map(place => this.formatPlaceData(place, location));
                    resolve(gyms);
                } else {
                    reject(new Error(`Places search failed: ${status}`));
                }
            });
        });
    }

    // Format place data
    formatPlaceData(place, userLocation) {
        const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
        };

        return {
            id: place.place_id,
            name: place.name,
            address: place.vicinity,
            location: location,
            distance: this.calculateDistance(userLocation, location),
            rating: place.rating || 0,
            totalRatings: place.user_ratings_total || 0,
            priceLevel: place.price_level || 0,
            isOpen: place.opening_hours ? place.opening_hours.open_now : null,
            photos: place.photos ? place.photos.map(photo => photo.getUrl()) : [],
            types: place.types,
        };
    }

    // Get place details
    async getPlaceDetails(placeId) {
        await this.initializeGoogleMaps();
        
        return new Promise((resolve, reject) => {
            const service = new window.google.maps.places.PlacesService(
                document.createElement('div')
            );

            const request = {
                placeId: placeId,
                fields: [
                    'name',
                    'formatted_address',
                    'formatted_phone_number',
                    'website',
                    'opening_hours',
                    'photos',
                    'reviews',
                    'rating',
                    'user_ratings_total',
                    'geometry',
                ],
            };

            service.getDetails(request, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    resolve(this.formatDetailedPlaceData(place));
                } else {
                    reject(new Error(`Place details request failed: ${status}`));
                }
            });
        });
    }

    // Format detailed place data
    formatDetailedPlaceData(place) {
        return {
            name: place.name,
            address: place.formatted_address,
            phone: place.formatted_phone_number,
            website: place.website,
            location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            },
            rating: place.rating,
            totalRatings: place.user_ratings_total,
            hours: place.opening_hours ? {
                weekdayText: place.opening_hours.weekday_text,
                periods: place.opening_hours.periods,
                isOpen: place.opening_hours.isOpen(),
            } : null,
            photos: place.photos ? place.photos.map(photo => ({
                url: photo.getUrl({ maxWidth: 800 }),
                attribution: photo.html_attributions,
            })) : [],
            reviews: place.reviews ? place.reviews.map(review => ({
                author: review.author_name,
                rating: review.rating,
                text: review.text,
                time: new Date(review.time * 1000).toLocaleDateString(),
                profilePhoto: review.profile_photo_url,
            })) : [],
        };
    }

    // Add marker to map
    addMarker(map, position, options = {}) {
        const marker = new window.google.maps.Marker({
            position,
            map,
            title: options.title || '',
            icon: options.icon || this.getMarkerIcon(options.type),
            animation: options.animation || window.google.maps.Animation.DROP,
            ...options,
        });

        if (options.id) {
            this.markers.set(options.id, marker);
        }

        if (options.infoWindow) {
            const infoWindow = new window.google.maps.InfoWindow({
                content: options.infoWindow,
            });

            marker.addListener('click', () => {
                // Close all other info windows
                this.infoWindows.forEach(iw => iw.close());
                infoWindow.open(map, marker);
            });

            if (options.id) {
                this.infoWindows.set(options.id, infoWindow);
            }
        }

        return marker;
    }

    // Get marker icon based on type
    getMarkerIcon(type) {
        const icons = {
            gym: {
                url: '/assets/icons/gym-marker.png',
                scaledSize: new window.google.maps.Size(40, 40),
            },
            trainer: {
                url: '/assets/icons/trainer-marker.png',
                scaledSize: new window.google.maps.Size(40, 40),
            },
            user: {
                url: '/assets/icons/user-marker.png',
                scaledSize: new window.google.maps.Size(40, 40),
            },
        };

        return icons[type] || null;
    }

    // Remove marker
    removeMarker(markerId) {
        const marker = this.markers.get(markerId);
        if (marker) {
            marker.setMap(null);
            this.markers.delete(markerId);
        }

        const infoWindow = this.infoWindows.get(markerId);
        if (infoWindow) {
            infoWindow.close();
            this.infoWindows.delete(markerId);
        }
    }

    // Clear all markers
    clearAllMarkers() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers.clear();
        this.infoWindows.forEach(infoWindow => infoWindow.close());
        this.infoWindows.clear();
    }

    // Get directions
    async getDirections(origin, destination, travelMode = 'DRIVING') {
        await this.initializeGoogleMaps();
        
        return new Promise((resolve, reject) => {
            const directionsService = new window.google.maps.DirectionsService();

            const request = {
                origin,
                destination,
                travelMode: window.google.maps.TravelMode[travelMode],
                unitSystem: window.google.maps.UnitSystem.METRIC,
            };

            directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    resolve({
                        routes: result.routes,
                        distance: result.routes[0].legs[0].distance,
                        duration: result.routes[0].legs[0].duration,
                        steps: result.routes[0].legs[0].steps,
                    });
                } else {
                    reject(new Error(`Directions request failed: ${status}`));
                }
            });
        });
    }

    // Render directions on map
    renderDirections(map, directionsResult) {
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
            map,
            directions: directionsResult,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: '#df2528',
                strokeWeight: 5,
                strokeOpacity: 0.8,
            },
        });

        return directionsRenderer;
    }

    // Geocode address
    async geocodeAddress(address) {
        await this.initializeGoogleMaps();
        
        return new Promise((resolve, reject) => {
            const geocoder = new window.google.maps.Geocoder();

            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK') {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                        formattedAddress: results[0].formatted_address,
                        placeId: results[0].place_id,
                    });
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    }

    // Reverse geocode
    async reverseGeocode(lat, lng) {
        await this.initializeGoogleMaps();
        
        return new Promise((resolve, reject) => {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat, lng };

            geocoder.geocode({ location: latlng }, (results, status) => {
                if (status === 'OK') {
                    if (results[0]) {
                        resolve({
                            formattedAddress: results[0].formatted_address,
                            placeId: results[0].place_id,
                            addressComponents: results[0].address_components,
                        });
                    } else {
                        reject(new Error('No results found'));
                    }
                } else {
                    reject(new Error(`Reverse geocoding failed: ${status}`));
                }
            });
        });
    }

    // Create search box
    createSearchBox(inputElement, map) {
        const searchBox = new window.google.maps.places.SearchBox(inputElement);
        
        map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds());
        });

        searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;

            // Clear old markers
            this.clearAllMarkers();

            // Add markers for each place
            const bounds = new window.google.maps.LatLngBounds();
            places.forEach(place => {
                if (!place.geometry || !place.geometry.location) return;

                this.addMarker(map, place.geometry.location, {
                    title: place.name,
                    id: place.place_id,
                });

                if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });

            map.fitBounds(bounds);
        });

        return searchBox;
    }

    // Get map styles
    getMapStyles() {
        return [
            {
                featureType: 'poi.business',
                stylers: [{ visibility: 'off' }],
            },
            {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'off' }],
            },
        ];
    }

    // Check if location is within bounds
    isLocationInBounds(location, bounds) {
        return location.lat >= bounds.south &&
               location.lat <= bounds.north &&
               location.lng >= bounds.west &&
               location.lng <= bounds.east;
    }

    // Get bounds for radius
    getBoundsForRadius(center, radiusInKm) {
        const lat = center.lat;
        const lng = center.lng;
        
        // Approximate calculations
        const latChange = radiusInKm / 111.32;
        const lngChange = radiusInKm / (111.32 * Math.cos(lat * Math.PI / 180));

        return {
            north: lat + latChange,
            south: lat - latChange,
            east: lng + lngChange,
            west: lng - lngChange,
        };
    }
}

// Export singleton instance
const mapUtils = new MapUtils();
export default mapUtils;

// Export individual functions
export const {
    initializeGoogleMaps,
    createMap,
    getCurrentLocation,
    calculateDistance,
    searchNearbyGyms,
    getPlaceDetails,
    addMarker,
    removeMarker,
    clearAllMarkers,
    getDirections,
    renderDirections,
    geocodeAddress,
    reverseGeocode,
    createSearchBox,
} = mapUtils;
