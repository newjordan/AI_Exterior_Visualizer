# AI Exterior Visualizer

Transform your home's exterior design with AI-powered visualization. Upload a photo of your house and instantly see how different siding, roofing, trim, and door materials would look using Google's Gemini AI.

![AI Exterior Visualizer Demo](ai_exterior_image.png)

## 🎯 Purpose

This application helps homeowners, contractors, and designers visualize exterior home renovations before making expensive material decisions. By leveraging Gemini's advanced image processing capabilities, the app can:

- **Intelligently segment** house components (siding, roofing, trim, doors)
- **Apply realistic materials** with proper lighting and shadows
- **Provide instant visual feedback** through before/after comparisons
- **Support custom materials** by uploading your own texture images

## ✨ Features

### AI-Powered Image Analysis
- Automatic house component detection using Gemini's vision models
- Precise segmentation masks for siding, roofing, trim, and doors
- Smart material application that respects lighting and perspective

### Interactive Design Studio
- Extensive catalog of real building materials
- Custom material upload support
- Color customization for each component
- Real-time preview capabilities

### Professional Results
- High-quality output maintaining original image dimensions
- Realistic material textures and lighting effects
- Before/after comparison slider
- Downloadable results for sharing

### User Experience
- Drag-and-drop image upload
- Progressive loading with status indicators
- Mobile-responsive design
- Intuitive material selection interface

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/newjordan/AI_Exterior_Visualizer.git
   cd AI_Exterior_Visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎨 How It Works

### Step 1: Image Upload
Upload a clear photo of a house exterior or use the provided sample image.

### Step 2: AI Analysis
The app uses Gemini's image processing to:
- Generate precise segmentation masks for each house component
- Analyze the structure and identify materials
- Prepare the image for material application

### Step 3: Design Selection
Choose from our curated catalog of materials:
- **Siding**: Various styles including shake, horizontal, and board & batten
- **Roofing**: Asphalt shingles, metal, tile options
- **Trim**: Different colors and finishes
- **Doors**: Styles and color combinations

### Step 4: AI Visualization
Gemini applies your selected materials while:
- Maintaining realistic lighting and shadows
- Preserving architectural details
- Ensuring photorealistic results

### Step 5: Results
View your transformation through:
- Dramatic countdown reveal
- Interactive before/after slider
- Full-resolution final result
- Download and sharing options

## 🏗️ Technical Architecture

### Frontend Stack
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **Tailwind CSS** - Utility-first styling

### AI Integration
- **Google Gemini API** - Advanced image processing
- **Gemini 2.5 Flash** - High-speed image generation
- **Custom prompting** - Optimized for architectural visualization

### Key Components
- `InitialScreen` - Landing page and image upload
- `MaskingScreen` - AI analysis progress display
- `DesignStudio` - Material selection interface
- `ResultDisplay` - Visualization results and comparison

## 🛠️ Configuration

### Material Catalog
Edit `products.json` to customize available materials:
```json
{
  "siding": [
    {
      "label": "Siding Styles",
      "options": [
        {
          "value": "Grey Shake Siding",
          "label": "Grey Shake",
          "colors": ["Ash Grey", "Stone Grey", "Pewter"],
          "imageUrls": ["texture_url_1", "texture_url_2"]
        }
      ]
    }
  ]
}
```

### API Settings
The app uses Gemini's latest image processing models with optimized settings for:
- High-quality mask generation
- Realistic material application
- Fast processing times

## 🎯 Use Cases

### For Homeowners
- Visualize renovation ideas before purchasing materials
- Compare different material combinations
- Share design concepts with contractors

### For Contractors
- Present options to clients visually
- Reduce material waste from poor choices
- Close more deals with confident customers

### For Designers
- Rapid prototyping of exterior concepts
- Client presentation materials
- Design iteration and exploration

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
├── services/           # API integration
├── types.ts           # TypeScript definitions
├── products.json      # Material catalog
└── constants.ts       # App configuration
```

### Building for Production
```bash
npm run build
npm run preview
```

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

This project was created for the Gemini AI Hackathon. Feel free to fork and extend the functionality.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with Google's Gemini AI for the Gemini Developer Competition. Special thanks to the Gemini team for providing powerful image processing capabilities that make this visualization possible.
