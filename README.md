# term1nal Terminal

A cyberpunk-themed terminal emulator built with Electron, React, and xterm.js, featuring a sleek terminal interface.

## Features

- 🎨 **Cyberpunk UI** - Clean neon interface with scanlines effect
- 🖥️ **Real Terminal** - Full-featured terminal powered by xterm.js and child_process
- 📑 **Multiple Tabs** - Create and manage multiple terminal sessions
- 🎨 **Theme Switching** - 5 different color themes (Red, Yellow, Green, Blue, White)
- ⚙️ **Settings Panel** - Customize font size, cursor style, and shell preferences
- ⌨️ **Keyboard Shortcuts** - Standard terminal shortcuts (Cmd/Ctrl+T, Cmd/Ctrl+W)
- 📱 **Responsive Design** - Dynamic sizing and collapsible sidebars
- 🔧 **Sidebar Toggle** - Hide/show left and right panels for full-screen terminal

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd term1nal

# Install dependencies
npm install

# Start development
npm run electron:dev
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron in development
npm run electron:dev

# Build for production
npm run build
```

## Technology Stack

- **Electron** - Desktop app framework
- **React** - UI framework with TypeScript
- **Vite** - Build tool and dev server
- **xterm.js** - Terminal emulator with FitAddon
- **child_process** - Native shell integration
- **CSS Grid** - Responsive layout system

## Keyboard Shortcuts

- `Cmd/Ctrl + T` - New tab
- `Cmd/Ctrl + W` - Close tab

## Layout

The application features a responsive 3-column layout:
- **Left Column**: System information and help section
- **Center Column**: Terminal with tab management and dynamic sizing
- **Right Column**: Theme selector and terminal settings
- **Sidebar Controls**: Toggle buttons to hide/show panels for full-screen terminal

## Terminal Features

- Real system command execution (bash/zsh on macOS/Linux, cmd on Windows)  
- Dynamic terminal sizing based on window dimensions
- Multiple concurrent terminal sessions
- Proper ANSI color and formatting support
- Clean output formatting for commands like `ls -l`

## License

MIT License