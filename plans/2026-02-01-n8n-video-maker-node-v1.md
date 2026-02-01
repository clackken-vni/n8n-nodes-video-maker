# n8n-nodes-video-maker Implementation Plan

## Objective

Tạo một n8n Community Node tên là `n8n-nodes-video-maker` để tạo video slideshow từ nhiều ảnh và âm thanh sử dụng FFmpeg. Node hỗ trợ transitions, Ken Burns effect, watermark, text overlay, và output MP4 (H.264/H.265).

## Project Structure

```
n8n-nodes-video-maker/
├── package.json                    # npm package config cho n8n
├── tsconfig.json                   # TypeScript config
├── .eslintrc.js                    # ESLint config
├── .prettierrc                     # Prettier config
├── README.md                       # Documentation
├── LICENSE                         # MIT License
├── tsconfig.build.json             # Build config
├── nodes/
│   └── VideoMaker/
│       ├── VideoMaker.node.ts      # Main node logic
│       ├── VideoMaker.node.json    # Node codex/metadata
│       ├── VideoMaker.node.svg     # Node icon (256x256)
│       └── actions/
│           ├── createVideo.action.ts    # Main video creation action
│           └── processImage.action.ts   # Image preprocessing action
├── lib/
│   ├── ffmpeg/
│   │   ├── index.ts                # FFmpeg wrapper exports
│   │   ├── installer.ts            # Auto-install FFmpeg
│   │   ├── commands.ts             # FFmpeg command builder
│   │   └── progress.ts             # Progress reporter
│   ├── utils/
│   │   ├── index.ts                # Utils exports
│   │   ├── download.ts             # URL downloader
│   │   ├── tempManager.ts          # Temp file management
│   │   └── validation.ts           # Input validation
│   └── types/
│       └── index.ts                # TypeScript interfaces
├── test/
│   └── VideoMaker.test.ts          # Unit tests
└── .npmignore
```

---

## Implementation Tasks

### Phase 1: Project Setup (2 giờ)

- [ ] 1.1 Tạo package.json với dependencies và n8n peerDependency
- [ ] 1.2 Cấu hình TypeScript (tsconfig.json, tsconfig.build.json)
- [ ] 1.3 Cấu hình ESLint và Prettier
- [ ] 1.4 Cài đặt dependencies: fluent-ffmpeg, ffmpeg-static, axios, tmp
- [ ] 1.5 Tạo folder structure cơ bản

### Phase 2: FFmpeg Integration (4 giờ)

- [ ] 2.1 Tạo `lib/ffmpeg/installer.ts`:
  - Kiểm tra FFmpeg đã cài chưa
  - Hỗ trợ cài đặt tự động qua package manager (apt, brew, choco)
  - Sử dụng ffmpeg-static cho fallback

- [ ] 2.2 Tạo `lib/ffmpeg/commands.ts`:
  - Hàm build slideshow command từ images + duration
  - Hàm build transition command (fade, slide, dissolve, zoom, wipe, rotate)
  - Hàm build audio command (background music)
  - Hàm build overlay command (watermark, text)
  - Hàm build Ken Burns command

- [ ] 2.3 Tạo `lib/ffmpeg/progress.ts`:
  - Parse FFmpeg output để lấy progress
  - Emit events cho n8n

- [ ] 2.4 Export từ `lib/ffmpeg/index.ts`

### Phase 3: Utility Functions (2 giờ)

- [ ] 3.1 Tạo `lib/utils/download.ts`:
  - Download từ URL (axios với stream)
  - Validate file type
  - Lấy metadata (dimensions, duration)

- [ ] 3.2 Tạo `lib/utils/tempManager.ts`:
  - Tạo thư mục temp cho processing
  - Cleanup sau khi hoàn thành
  - Quản lý concurrency

- [ ] 3.3 Tạo `lib/utils/validation.ts`:
  - Validate image format (jpg, png, webp, gif)
  - Validate audio format (mp3, wav, aac, ogg)
  - Validate URL format
  - Validate resolution values

- [ ] 3.4 Export từ `lib/utils/index.ts`

### Phase 4: Type Definitions (1 giờ)

- [ ] 4.1 Tạo `lib/types/index.ts`:
  - Interface VideoMakerOptions
  - Interface ImageInput (URL, binary data, override options)
  - Interface AudioInput
  - Interface TransitionOptions
  - Interface WatermarkOptions
  - Interface TextOverlayOptions
  - Interface KenBurnsOptions
  - Interface OutputOptions
  - Type definitions cho n8n

### Phase 5: Node Core (6 giờ)

- [ ] 5.1 Tạo `nodes/VideoMaker/VideoMaker.node.json`:
  - Node name, icon, description
  - Properties definition (inputs, outputs, parameters)
  - Codex entries

- [ ] 5.2 Tạo `nodes/VideoMaker/VideoMaker.node.ts`:
  - Node class extends INode
  - Constructor với properties definition
  - Methods:
    - `execute()`: Main execution logic
    - `processImages()`: Handle image inputs
    - `processAudio()`: Handle audio inputs
    - `createVideo()`: Call FFmpeg
    - `handleErrors()`: Error handling với retry

- [ ] 5.3 Tạo SVG icon (256x256) cho node

### Phase 6: Node Actions (4 giờ)

- [ ] 6.1 Tạo `nodes/VideoMaker/actions/createVideo.action.ts`:
  - Handle video creation với tất cả options per
  - Parse-image overrides
  - Build FFmpeg command
  - Execute với progress
  - Return binary output

- [ ] 6.2 Tạo `nodes/VideoMaker/actions/processImage.action.ts`:
  - Optional: Process images trước (resize, format convert)

### Phase 7: Transitions Implementation (4 giờ)

- [ ] 7.1 Fade transitions:
  - `ffmpeg -i image1.png -i image2.png -filter_complex "[0:v]fade=t=out:st=2:d=1[0v1];[1:v]fade=t=in:st=0:d=1[1v1];[0v1][1v1]concat"` 

- [ ] 7.2 Slide transitions:
  - Left: `[0:v][1:v]xfade=transition=slideleft:duration=0.5:offset=2`
  - Right, Up, Down tương tự

- [ ] 7.3 Dissolve/Crossfade:
  - `xfade=transition=dissolve:duration=0.5:offset=2`

- [ ] 7.4 Zoom transitions:
  - Zoom in: scale video với zoom
  - Zoom out tương tự

- [ ] 7.5 Wipe transitions:
  - Wipe left/right/up/down

- [ ] 7.6 Rotate transitions:
  - Rotate 90/180 degrees

### Phase 8: Overlays Implementation (3 giờ)

- [ ] 8.1 Watermark implementation:
  - Position: top-left, top-center, top-right, etc. (9 positions)
  - Opacity: `[format=rgba][watermark]overlay=x=10:y=10:format=auto,colorchannelmixer=aa=0.5`
  - Resize: scale watermark to percentage

- [ ] 8.2 Text overlay implementation:
  - Drawtext filter: `drawtext=text='Title':x=100:y=100:fontsize=24:fontcolor=white`
  - Font support: load custom fonts
  - Position: all 9 positions + custom
  - Animation: fade in/out, slide in, typewriter effect

- [ ] 8.3 Per-image text captions:
  - Text for each specific image
  - Sync với image duration

### Phase 9: Ken Burns Effect (2 giờ)

- [ ] 9.1 Pan & Zoom implementation:
  - Zoom in: `scale=1920:1080,zoompan=z='min(zoom+0.0015,1.5)':d=300:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080`
  - Zoom out: similar với decreasing zoom
  - Pan directions: left, right, up, down

- [ ] 9.2 Ken Burns options:
  - Duration per image
  - Zoom level (1x to 2x)
  - Pan direction và distance

### Phase 10: Error Handling & Retry (2 giờ)

- [ ] 10.1 Input validation với detailed errors
- [ ] 10.2 FFmpeg error parsing và mapping
- [ ] 10.3 Retry mechanism (configurable retries)
- [ ] 10.4 Progress reporting events
- [ ] 10.5 Detailed logging (optional toggle)

### Phase 11: Testing (3 giờ)

- [ ] 11.1 Unit tests cho lib/utils/*
- [ ] 11.2 Unit tests cho lib/ffmpeg/*
- [ ] 11.3 Integration test với sample images/audio
- [ ] 11.4 Edge cases testing:
  - Single image
  - Single image + no audio
  - Different aspect ratios
  - Missing files
  - Invalid inputs

### Phase 12: Documentation (2 giờ)

- [ ] 12.1 README.md:
  - Installation instructions
  - Quick start guide
  - Node options documentation
  - Examples
  - Troubleshooting

- [ ] 12.2 Add n8n codex metadata

### Phase 13: Publishing Prep (1 giờ)

- [ ] 13.1 Test installation from local path
- [ ] 13.2 Verify npm package metadata
- [ ] 13.3 Create .npmignore
- [ ] 13.4 Test trong clean n8n instance

---

## Node Properties UI Structure

### Main Tab: Input
```
imagesSource: "binary" | "url"
imagesBinaryProperty: string (khi binary)
imageUrls: string (textarea, 1 URL per line, JSON format)
audioSource: "binary" | "url"
audioBinaryProperty: string (khi binary)
audioUrl: string (khi url)
```

### Tab: Output Settings
```
outputFormat: "mp4-h264" | "mp4-h265" | "webm"
resolution: "1080p" | "720p" | "480p" | "vertical-9-16" | "square-1-1" | "custom"
customWidth: number (khi custom)
customHeight: number (khi custom)
quality: "low" | "medium" | "high" | "ultra"
fps: number (default 30)
```

### Tab: Slideshow Settings
```
durationMode: "match-audio" | "per-image-total" | "custom"
defaultImageDuration: number (seconds)
defaultTransition: "none" | "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "dissolve" | "zoom-in" | "zoom-out" | "wipe" | "rotate"
transitionDuration: number (seconds)
kenBurnsEnabled: boolean
kenBurnsZoom: number (1.1 to 2.0)
kenBurnsDirection: "in" | "out" | "pan-left" | "pan-right" | "pan-up" | "pan-down"
```

### Tab: Watermark (Optional)
```
watermarkEnabled: boolean
watermarkSource: "binary" | "url"
watermarkBinaryProperty: string
watermarkUrl: string
watermarkPosition: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right" | "custom"
watermarkX: number (khi custom)
watermarkY: number (khi custom)
watermarkOpacity: number (0.1 to 1.0)
watermarkScale: number (percentage, default 20)
watermarkMargin: number (margin from edge)
```

### Tab: Text Overlay (Optional)
```
textOverlayEnabled: boolean
textContent: string
textPerImage: JSON string (array với text cho từng ảnh)
fontName: string (Arial, Roboto, etc.)
fontSize: number
fontColor: string (#FFFFFF)
fontPath: string (custom font file)
textPosition: "top-left" | ... | "bottom-center" | "custom"
textX: number (khi custom)
textY: number (khi custom)
textAnimation: "none" | "fade-in" | "fade-out" | "slide-in" | "typewriter"
animationDuration: number
```

### Tab: Per-Image Overrides (Advanced)
```
imageOverrides: JSON string (array của override objects)
Override structure:
{
  index: number,
  duration?: number,
  transition?: string,
  transitionDuration?: number,
  kenBurnsEnabled?: boolean,
  kenBurnsZoom?: number,
  kenBurnsDirection?: string,
  text?: string
}
```

### Tab: Advanced
```
retryCount: number (0-5)
retryDelay: number (seconds)
logLevel: "none" | "basic" | "detailed"
tempDir: string (custom temp directory)
cleanupTempFiles: boolean
```

---

## Dependencies

```json
{
  "dependencies": {
    "n8n-workflow": "^1.0.0",
    "fluent-ffmpeg": "^2.1.3",
    "ffmpeg-static": "^5.2.0",
    "axios": "^1.7.0",
    "tmp": "^0.2.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/fluent-ffmpeg": "^1.0.0",
    "@types/tmp": "^0.2.0",
    "@types/axios": "^0.14.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  },
  "peerDependencies": {
    "n8n": ">=1.0.0"
  }
}
```

---

## Verification Criteria

- [ ] Node có thể cài đặt qua npm install
- [ ] Node xuất hiện trong n8n editor
- [ ] Node nhận binary data từ n8n workflow
- [ ] Node nhận URL inputs
- [ ] Video output được trả về dạng binary
- [ ] Transitions hoạt động mượt
- [ ] Ken Burns effect visible
- [ ] Watermark hiển thị đúng vị trí
- [ ] Text overlay có animation
- [ ] FFmpeg auto-install hoạt động
- [ ] Error handling với retry works
- [ ] Progress reporting updates correctly
- [ ] Tests pass
- [ ] README đầy đủ và clear

---

## Potential Risks and Mitigations

1. **FFmpeg installation on different OS**
   - Mitigation: Sử dụng ffmpeg-static package, fallback to system FFmpeg detection, auto-install scripts cho Windows/Mac/Linux

2. **Memory issues với large video files**
   - Mitigation: Stream processing, limit concurrent operations, cleanup temp files aggressively

3. **Complex FFmpeg filter chains có thể fail**
   - Mitigation: Test filter chains separately, provide fallback simple commands, detailed error messages

4. **n8n binary data format changes**
   - Mitigation: Use n8n's official binary data APIs, test với multiple n8n versions

5. **Transition performance issues**
   - Mitigation: Use xfade filter (more efficient), provide option to disable transitions for performance

---

## Alternative Approaches

1. **Sử dụng pre-built video template**
   - Pros: Faster execution, consistent quality
   - Cons: Less flexible, limited customization
   - Decision: Không chọn - cần full flexibility

2. **Sử dụng GPU encoding (NVENC/VAAPI)**
   - Pros: Much faster encoding
   - Cons: Hardware dependent, more complex setup
   - Decision: Consider v2 với performance optimization

3. **WebAssembly FFmpeg (ffmpeg.wasm)**
   - Pros: No FFmpeg installation needed
   - Cons: Browser only, slow, limited features
   - Decision: Không phù hợp cho n8n server-side

---

## Timeline Estimate

| Phase | Hours | Total |
|-------|-------|-------|
| Phase 1: Setup | 2 | 2 |
| Phase 2: FFmpeg | 4 | 6 |
| Phase 3: Utils | 2 | 8 |
| Phase 4: Types | 1 | 9 |
| Phase 5: Node Core | 6 | 15 |
| Phase 6: Actions | 4 | 19 |
| Phase 7: Transitions | 4 | 23 |
| Phase 8: Overlays | 3 | 26 |
| Phase 9: Ken Burns | 2 | 28 |
| Phase 10: Error Handling | 2 | 30 |
| Phase 11: Testing | 3 | 33 |
| Phase 12: Documentation | 2 | 35 |
| Phase 13: Publishing | 1 | 36 |

**Estimated Total: 36 hours (4-5 working days)**

---

## Next Steps

1. Review và approve plan
2. Tạo project folder và initialize với package.json
3. Bắt đầu Phase 1: Project Setup
