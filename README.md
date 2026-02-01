# n8n-nodes-video-maker

An n8n community node for creating video slideshows from images and audio using FFmpeg.

![Video Maker Node](nodes/VideoMaker/videomaker.svg)

## Features

- Create video slideshows from multiple images
- Add background audio from file or URL
- Multiple transition effects (Fade, Slide, Dissolve, Zoom)
- Ken Burns effect for dynamic still images
- Watermark support with position and opacity control
- Text overlay with font styling and animations
- Multiple output formats (MP4 H.264, MP4 H.265, WebM)
- Resolution presets (1080p, 720p, 480p, Vertical 9:16, Square 1:1)
- Custom resolution support
- Automatic FFmpeg installation
- Progress reporting during video creation

## Installation

### Option 1: Install from npm (recommended)

```bash
cd your-n8n-instance
npm install n8n-nodes-video-maker
```

### Option 2: Install from source

```bash
git clone https://github.com/yourusername/n8n-nodes-video-maker.git
cd n8n-nodes-video-maker
npm install
npm run build
npm link
```

### Option 3: Manual installation

Copy the `dist` folder contents to your n8n custom nodes directory:

```bash
cp -r dist/* ~/.n8n/custom/
```

## Requirements

- Node.js 18+
- FFmpeg (will be auto-installed if not present)
- n8n 1.0+

## Usage

### Basic Workflow

1. Add an HTTP Request node to fetch images
2. Add the Video Maker node
3. Configure the node settings
4. Connect output to your desired destination

### Node Settings

#### Input Images

- **Images Source**: Choose between Binary Data or URLs
- **Binary Property**: Property name containing images (for binary mode)
- **Image URLs**: One URL per line or JSON array (for URL mode)

#### Input Audio

- **Audio Source**: Binary Data, URL, or None (silent video)
- **Audio URL**: URL to audio file

#### Output Settings

- **Output Format**: MP4 (H.264), MP4 (H.265/HEVC), or WebM
- **Resolution**: Preset resolutions or custom size
- **Quality**: Low, Medium, High, or Ultra
- **FPS**: Frames per second (1-120)

#### Slideshow Settings

- **Duration Mode**: Match Audio Length, Sum of Images, or Custom
- **Default Image Duration**: How long each image is displayed
- **Default Transition**: Transition effect between images
- **Transition Duration**: How long the transition lasts
- **Ken Burns Effect**: Enable subtle pan and zoom

#### Watermark (Optional)

- **Enable Watermark**: Add logo to video
- **Source**: Binary Data or URL
- **Position**: 9-position placement
- **Opacity**: 0.1 to 1.0
- **Scale**: Watermark size as percentage

#### Text Overlay (Optional)

- **Enable Text Overlay**: Add text to video
- **Text Content**: Text to display
- **Font Size**: 8 to 200
- **Font Color**: Color picker
- **Position**: 9-position placement
- **Animation**: Fade In, Fade Out, Slide In, or None

#### Advanced Settings

- **Retry Count**: Number of retry attempts on failure
- **Retry Delay**: Seconds between retries
- **Log Level**: None, Basic, or Detailed
- **Cleanup Temp Files**: Remove temporary files after processing

## Examples

### Create Video from Images with Audio

```json
{
  "nodes": [
    {
      "parameters": {
        "urls": "https://example.com/image1.jpg\nhttps://example.com/image2.jpg\nhttps://example.com/image3.jpg"
      },
      "name": "Get Images",
      "type": "n8n-nodes-video-maker",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "audioUrl": "https://example.com/music.mp3"
      },
      "name": "Create Video",
      "type": "n8n-nodes-video-maker",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {},
      "name": "Save to Dropbox",
      "type": "n8n-nodes.dropbox",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ]
}
```

### Create Vertical Video for Social Media

```json
{
  "nodes": [
    {
      "parameters": {
        "urls": "https://example.com/photo1.jpg"
      },
      "name": "Get Photo",
      "type": "n8n-nodes-video-maker",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "resolution": "vertical-9-16",
        "outputFormat": "mp4-h264",
        "kenBurnsEnabled": true,
        "kenBurnsZoom": 1.3,
        "textOverlayEnabled": true,
        "textContent": "Check out our new product!",
        "fontSize": 60
      },
      "name": "Create Reel",
      "type": "n8n-nodes-video-maker",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## Transition Effects

| Effect | Description |
|--------|-------------|
| None | No transition, hard cut |
| Fade | Crossfade between images |
| Slide Left | New image slides in from right |
| Slide Right | New image slides in from left |
| Dissolve | Smooth dissolve transition |
| Zoom In | Zoom into new image |
| Zoom Out | Zoom out from old image |

## Supported Formats

### Input
- **Images**: JPEG, PNG, WebP, GIF, BMP
- **Audio**: MP3, WAV, AAC, OGG, M4A

### Output
- **Video**: MP4 (H.264/H.265), WebM

## Troubleshooting

### FFmpeg not found

The node will attempt to auto-install FFmpeg. If this fails:

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Debian/Ubuntu):**
```bash
apt-get install ffmpeg
```

**Windows:**
```bash
choco install ffmpeg
```

### Memory issues with large videos

Reduce quality settings or use lower resolution for large projects.

### Video creation fails

Check the log level is set to "Detailed" for more information. Common issues:
- Invalid image/audio URLs
- Corrupted input files
- Insufficient disk space

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: https://github.com/yourusername/n8n-nodes-video-maker/issues
- n8n Community Forum: https://community.n8n.io/

## Changelog

### v1.0.0

- Initial release
- Basic slideshow creation
- Audio support
- Multiple transitions
- Ken Burns effect
- Watermark support
- Text overlay
- Progress reporting
