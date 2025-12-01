# MTG Final Fantasy Collection Tracker

A web application built with Angular 19 to track and manage your Magic: The Gathering Final Fantasy card collection. This tool helps you keep track of which cards you own, their quantities (normal and foil), and the estimated value of your collection.

## Features

### Collection Management
- **Complete Set Overview**: View all 313 cards from the MTG Final Fantasy set
- **Card Tracking**: Track both normal and foil versions of each card
- **Wishlist System**: Mark cards you want to acquire with a star system
- **Collection Progress**: Real-time statistics showing total cards owned and completion percentage
- **Estimated Value**: View the estimated value of your collection based on Cardmarket prices via Scryfall

### Advanced Filtering
- **Search by Name**: Quickly find cards by typing their name
- **Filter by Rarity**: Common, Uncommon, Rare, or Mythic
- **Filter by Ownership**: View only owned cards, missing cards, foil-owned cards, or wishlist cards
- **Filter by Print Type**: Show only cards with foil or non-foil versions available

### Data Management
- **Export Collection**: Save your collection data as a JSON file for backup
- **Import Collection**: Restore your collection from a previously exported JSON file
- **Persistent Storage**: Your collection is automatically saved to browser's local storage

### User Interface
- **Bilingual Support**: Switch between Spanish and English languages
- **Card Images**: High-quality card images from Scryfall
- **Direct Links**: Click on cards to view them on Cardmarket
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Easy on the eyes dark interface

### Integration
- **Scryfall API**: Fetches card data and images directly from Scryfall
- **Cardmarket Links**: Direct links to buy/sell cards on Cardmarket
- **Real-time Pricing**: Shows current market prices when available

## Running the Application

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mascalerino/mtg-ff-collection.git
cd mtg-ff-collection
```

2. Install dependencies:
```bash
npm install
```

### Development Server

Start the development server:
```bash
npm start
```

Or using Angular CLI:
```bash
ng serve
```

The application will be available at `http://localhost:4200/`. The app will automatically reload when you make changes to the source files.

### Building for Production

Build the project for production:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory, optimized for performance.

### Running Tests

Execute unit tests:
```bash
npm test
```

## Technology Stack

- **Angular 19**: Modern web framework
- **TypeScript**: Type-safe development
- **SCSS**: Stylish and maintainable styling
- **RxJS**: Reactive programming for async operations
- **Scryfall API**: Card data and images

## Project Structure

```
src/
├── app/
│   ├── models/          # Data models (MTG Card, Scryfall types)
│   ├── services/        # API services (Scryfall, Collection)
│   ├── app.component.*  # Main application component
│   └── app.config.ts    # Application configuration
├── assets/
│   └── i18n/           # Translation files (es.json, en.json)
└── styles.scss         # Global styles
```

## License

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.8.


```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
