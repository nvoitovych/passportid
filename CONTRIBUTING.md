# Contributing to PassportID

Thank you for your interest in contributing to PassportID! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/passportid/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Any implementation ideas (optional)

### Contributing Code

1. **Fork the repository**
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write clear commit messages
   - Add comments for complex logic
   - Test your changes thoroughly

4. **Run checks**:
   ```bash
   npm run check
   npm run build
   ```

5. **Commit your changes**:
   ```bash
   git commit -m "Add: description of your changes"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description
   - Reference any related issues
   - Add screenshots for UI changes

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow Svelte best practices
- Use meaningful variable and function names
- Keep functions focused and small
- Add JSDoc comments for public APIs

### Commit Messages

Use clear, descriptive commit messages:

- `Add: feature description`
- `Fix: bug description`
- `Update: what was updated`
- `Refactor: what was refactored`
- `Docs: documentation changes`

### Testing

- Test your changes in multiple browsers
- Test on mobile devices when applicable
- Verify offline functionality
- Check PWA behavior

### Adding Document Requirements

To add new document requirements:

1. Edit `src/lib/data/requirements-config.json`
2. Follow the existing format:
   ```json
   {
     "id": "country-document-type",
     "country": "Country Name",
     "countryCode": "XX",
     "type": "passport|visa|id|driver|other",
     "name": "Display Name",
     "description": "Description",
     "source": "Source URL or authority",
     "requirements": {
       "width": 600,
       "height": 600,
       "dpi": 300,
       "background": "white|colored",
       "headHeightMM": [25, 35],
       "headHeightPerc": [50, 70],
       "headPosition": {
         "top": 15,
         "bottom": 85,
         "eyeLineMM": [28, 35]
       },
       "minHeadSize": 50
     },
     "tips": ["Tip 1", "Tip 2"]
   }
   ```

3. Verify the requirements are accurate from official sources
4. Test the document in the app

## Project Structure

- `src/lib/components/` - Reusable Svelte components
- `src/lib/canvas/` - Image processing logic
- `src/lib/data/` - Document requirements data
- `src/lib/stores/` - State management
- `src/lib/types/` - TypeScript definitions
- `src/lib/utils/` - Utility functions
- `src/routes/` - Page routes

## Questions?

Feel free to open an issue for questions or discussions. We're here to help!

Thank you for contributing to PassportID! 🎉

