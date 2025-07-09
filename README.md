# Konverse - WhatsApp Flows Management Platform

A modern, production-ready platform for creating, managing, and deploying WhatsApp Business Flows with a visual drag-and-drop interface.

## 🚀 Features

- **Visual Flow Builder**: Drag-and-drop interface for creating WhatsApp conversation flows
- **Real-time Validation**: Comprehensive validation against WhatsApp Flows API specifications
- **Interactive Preview**: Test your flows with realistic WhatsApp-style previews
- **JSON Editor**: Professional code editor with syntax highlighting and error detection
- **Component Library**: Full library of WhatsApp Flows components (v7.1 compatible)
- **Deployment Integration**: Direct deployment to WhatsApp Business API
- **Flow Management**: Organize, duplicate, and manage multiple flows
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Flow Visualization**: React Flow
- **Code Editor**: Monaco Editor
- **Build Tool**: Vite
- **Validation**: AJV with custom WhatsApp Flows schema

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd konverse

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
VITE_META_ACCESS_TOKEN=your_whatsapp_business_access_token
VITE_META_WABA_ID=your_whatsapp_business_account_id
```

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run build:analyze

# Clean build artifacts
npm run clean
```

## 📱 WhatsApp Flows Components

Supports all official WhatsApp Flows components:

### Text Components
- TextHeading, TextSubheading, TextBody, TextCaption
- RichText with markdown support

### Input Components
- TextInput, TextArea, DatePicker
- CheckboxGroup, RadioButtonsGroup, Dropdown
- ChipsSelector, OptIn

### Media Components
- Image, ImageCarousel
- PhotoPicker, DocumentPicker

### Action Components
- Button, Footer, EmbeddedLink

### Container Components
- Form (with nested component support)

## 🎯 Performance Optimizations

- **Code Splitting**: Automatic chunking for optimal loading
- **Tree Shaking**: Eliminates unused code
- **Bundle Analysis**: Built-in bundle size analysis
- **Lazy Loading**: Components loaded on demand
- **Optimized Rendering**: Efficient React rendering patterns
- **Memory Management**: Proper cleanup and garbage collection

## 🔍 Validation & Testing

- **Real-time Validation**: Validates against WhatsApp Flows v7.1 schema
- **Error Highlighting**: Visual error indicators with auto-fix suggestions
- **Interactive Testing**: Test flows with realistic user interactions
- **JSON Schema Validation**: Comprehensive schema validation
- **Flow Connectivity**: Validates screen connections and navigation

## 📚 Documentation

- [WhatsApp Flows API Documentation](https://developers.facebook.com/docs/whatsapp/flows)
- [Component Reference](https://developers.facebook.com/docs/whatsapp/flows/reference/components)
- [Flow JSON Schema](https://developers.facebook.com/docs/whatsapp/flows/reference/flow-json)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [WhatsApp Business API documentation](https://developers.facebook.com/docs/whatsapp)
- Review the [troubleshooting guide](docs/troubleshooting.md)

---

Built with ❤️ for the WhatsApp Business ecosystem