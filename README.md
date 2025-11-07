# La Biglietteria (The Ticket Office)

![La Biglietteria Logo](progetto%20biglietti/immagini/logo.jpg)

## Project Description

La Biglietteria is a comprehensive web platform for selling tickets to events and concerts. The system allows users to browse events, purchase tickets, manage their profile, and much more. It also includes an administration interface for event management.

## Main Features

### For Users
- **Registration and Login**: Complete authentication system for users
- **Event Search**: Ability to search for events by name
- **Event Filters**: Filter events by date (today, tomorrow, weekend)
- **Event Details**: Detailed view of each event with information on date, time, location, and prices
- **Shopping Cart**: Add tickets to cart and manage purchases
- **User Profile**: Manage personal information and view purchased tickets
- **Virtual Assistant**: OpenAI-based chatbot to answer questions about artists and music
- **Reviews**: Ability to leave reviews on the platform

### For Administrators
- **Event Management**: Create, modify, and delete events
- **Venue Management**: Add new venues for events
- **Control Panel**: Dedicated interface for system management

## Technologies Used

### Backend
- **FastAPI**: Python framework for creating APIs
- **PostgreSQL**: Relational database for data storage
- **Psycopg**: PostgreSQL adapter for Python
- **OpenAI API**: Integration for the assistant chatbot
- **Docker**: Application containerization

### Frontend
- **HTML/CSS/JavaScript**: Standard web technologies for the user interface
- **Font Awesome**: Icons for the user interface
- **Responsive Design**: Interface adaptable to different devices

## Installation

### Prerequisites
- Docker and Docker Compose
- PostgreSQL account (local or remote)
- OpenAI API account (optional, for chatbot functionality)

### Configuration
1. Clone the repository:
   ```
   git clone https://github.com/tuousername/la-biglietteria.git
   cd la-biglietteria
   ```

2. Create an `.env` file in the main directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ADMIN_EMAIL=admin@gmail.com
   OPENAI_API_KEY=your_openai_api_key  # Optional
   ```

3. Start the application with Docker Compose:
   ```
   docker-compose up -d
   ```

4. The application will be available at `http://localhost:8000`

## Usage

### User Access
- Visit the homepage to browse available events
- Register or log in to purchase tickets
- Add tickets to cart and complete the purchase process

### Administrator Access
- Access the administrative area via `/admin/Login.html`
- Use admin credentials to manage events and venues

## Project Structure

```
la-biglietteria/
├── backend/                  # FastAPI Backend
│   ├── main.py               # API endpoints
│   ├── Dockerfile            # Docker configuration for backend
│   └── requirements.txt      # Python dependencies
├── progetto biglietti/       # Main Frontend
│   ├── biglietteria.html     # Main page
│   ├── styles.css            # CSS styles
│   ├── script.js             # JavaScript for frontend logic
│   ├── admin/                # Administrative interface
│   │   ├── Login.html        # Admin login page
│   │   ├── Admin.html        # Admin dashboard
│   │   └── style.css         # Styles for admin area
│   └── immagini/             # Images and resources
├── chi_siamo/                # "About Us" page
├── contatti/                 # "Contacts" page
├── privacy_policy/           # "Privacy Policy" page
├── termini_condizioni/       # "Terms and Conditions" page
├── docker-compose.yml        # Docker Compose configuration
└── README.md                 # Project documentation
```

## License

This project is distributed under the MIT license. See the `LICENSE` file for more details.

## Contact

For questions or support, contact us at:
- Email: gabriele.infojob@gmail.com


---

© 2025 La Biglietteria - All rights reserved
