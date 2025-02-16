// Blood Donation Connector - Real-Time Matching System

const STORAGE_KEYS = {
    USER_PROFILE: 'bloodDonation_userProfile',
    BLOOD_REQUESTS: 'bloodDonation_requests',
    LOCATION_DATA: 'bloodDonation_location'
};

class UserProfile {
    constructor(role = null, bloodType = null, contact = null) {
        this.role = role;
        this.bloodType = bloodType;
        this.contact = contact;
        this.location = null;
        this.lastActive = Date.now();
    }

    save() {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(this));
    }

    static load() {
        const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        return data ? JSON.parse(data) : new UserProfile();
    }
}

class BloodRequest {
    constructor(bloodType, location, urgency, contact) {
        this.id = Date.now();
        this.bloodType = bloodType;
        this.location = location;
        this.urgency = urgency;
        this.contact = contact;
        this.timestamp = new Date().toISOString();
        this.active = true;
    }

    static save(requests) {
        localStorage.setItem(STORAGE_KEYS.BLOOD_REQUESTS, JSON.stringify(requests));
    }

    static load() {
        const data = localStorage.getItem(STORAGE_KEYS.BLOOD_REQUESTS);
        return data ? JSON.parse(data) : [];
    }
}

class LocationService {
    static async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                position => {
                    const location = { lat: position.coords.latitude, lng: position.coords.longitude };
                    localStorage.setItem(STORAGE_KEYS.LOCATION_DATA, JSON.stringify(location));
                    resolve(location);
                },
                error => reject(error)
            );
        });
    }
}

class UIManager {
    static init() {
        this.setupEventListeners();
        this.updateRequestsFeed();
    }

    static setupEventListeners() {
        document.querySelectorAll('[data-role]').forEach(button => {
            button.addEventListener('click', (e) => this.handleRoleSelection(e));
        });

        const requestForm = document.getElementById('requestForm');
        if (requestForm) {
            requestForm.addEventListener('submit', (e) => this.handleRequestSubmission(e));
        }
    }

    static handleRequestSubmission(event) {
        event.preventDefault();
        const bloodType = document.getElementById('bloodType').value;
        const urgency = document.getElementById('urgency').value;
        const contact = document.getElementById('contact').value;
        const location = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCATION_DATA)) || null;

        if (!/^[6-9]\d{9}$/.test(contact)) {
            alert('Please enter a valid 10-digit Indian phone number.');
            return;
        }

        const request = new BloodRequest(bloodType, location, urgency, contact);
        const requests = BloodRequest.load();
        requests.push(request);
        BloodRequest.save(requests);

        this.updateRequestsFeed();
    }

    static updateRequestsFeed() {
        const requestsFeed = document.getElementById('requestsFeed');
        const requests = BloodRequest.load();
        
        requestsFeed.innerHTML = requests.map(request => `
            <div class="blood-request">
                <p><strong>Blood Type:</strong> ${request.bloodType}</p>
                <p><strong>Urgency:</strong> ${request.urgency}</p>
                <p><strong>Contact:</strong> ${request.contact}</p>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    UIManager.init();
    LocationService.getCurrentPosition().catch(error => console.error('Location error:', error));
});
class RequestTracker {
    static showNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: slideIn 0.5s ease-out;
            z-index: 1000;
        `;
        notification.textContent = "Request submitted successfully! Check 'My Requests' for status.";
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    static createMyRequestsPage() {
        const mainContent = document.querySelector('body');
        const currentContent = mainContent.innerHTML;

        // Create My Requests button
        const myRequestsBtn = document.createElement('button');
        myRequestsBtn.textContent = 'My Requests';
        myRequestsBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: var(--primary-blue);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;

        mainContent.appendChild(myRequestsBtn);

        myRequestsBtn.addEventListener('click', () => {
            const requests = BloodRequest.load();
            const userContact = document.getElementById('contact').value;
            const userRequests = requests.filter(req => req.contact === userContact);

            mainContent.innerHTML = `
                <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
                    <h2 style="color: var(--primary-red);">My Blood Donation Requests</h2>
                    <button id="backToMain" style="margin-bottom: 20px; padding: 10px 20px; background: var(--primary-blue); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Back to Main Page
                    </button>
                    <div id="requestsList">
                        ${userRequests.map((request, index) => `
                            <div class="blood-request" style="margin-bottom: 20px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <h3 style="color: var(--primary-red);">Request #${index + 1}</h3>
                                <p><strong>Blood Type:</strong> ${request.bloodType}</p>
                                <p><strong>Urgency:</strong> ${request.urgency}</p>
                                <p><strong>Contact:</strong> ${request.contact}</p>
                                <p><strong>Status:</strong> <span style="color: ${request.urgency === 'critical' ? '#ff4444' : '#4CAF50'}">
                                    ${request.urgency === 'critical' ? 'Urgent - Searching for donors' : 'Active - Waiting for match'}
                                </span></p>
                                <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                                <p><strong>Estimated Response Time:</strong> 
                                    ${request.urgency === 'critical' ? '2-4 hours' : 
                                      request.urgency === 'medium' ? '24-48 hours' : '3-5 days'}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                    ${userRequests.length === 0 ? '<p style="text-align: center; color: #666;">No requests found. Submit a request to see it here.</p>' : ''}
                </div>
            `;

            document.getElementById('backToMain').addEventListener('click', () => {
                mainContent.innerHTML = currentContent;
                UIManager.setupEventListeners();
                UIManager.updateRequestsFeed();
                RequestTracker.createMyRequestsPage();
            });
        });
    }
}

// Modify the handleRequestSubmission method to show notification
const originalHandleRequestSubmission = UIManager.handleRequestSubmission;
UIManager.handleRequestSubmission = function(event) {
    originalHandleRequestSubmission.call(this, event);
    RequestTracker.showNotification();
};

// Initialize the Request Tracker
RequestTracker.createMyRequestsPage();
