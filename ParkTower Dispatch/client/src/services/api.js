const API_BASE = 'http://localhost:3000/api';

export const parkingApi = {
    async init(config) {
        console.log('API: init', config);
        const response = await fetch(API_BASE + '/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        const data = await response.json();
        console.log('API Response:', data);
        return data;
    },

    async getState() {
        const response = await fetch(API_BASE + '/state');
        return response.json();
    },

    async arrive(carId) {
        const response = await fetch(API_BASE + '/arrive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ carId })
        });
        return response.json();
    },

    async requestPickup(carId) {
        const response = await fetch(API_BASE + '/request-pickup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ carId })
        });
        return response.json();
    },

    async step() {
        const response = await fetch(API_BASE + '/step', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.json();
    },

    async setElevatorFault(elevatorId, isFault) {
        const response = await fetch(API_BASE + '/set-elevator-fault', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ elevatorId, isFault })
        });
        return response.json();
    },

    async reset() {
        const response = await fetch(API_BASE + '/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.json();
    }
};
