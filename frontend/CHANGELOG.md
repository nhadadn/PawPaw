# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-01-25

### Added
- **ZoomImage Component**: 
  - New UI component providing image zoom capabilities.
  - Desktop: Hover-based lens zoom effect.
  - Mobile: Tap-to-expand functionality.
- **Lightbox Component**:
  - Full-screen image viewer using React Portals.
  - Keyboard navigation support (Arrow Left/Right, Escape).
  - Touch swipe gestures for mobile navigation.
  - Backdrop blur and image counter.
- **ProductGallery Enhancements**:
  - Integrated `ZoomImage` for main product display.
  - Added touch swipe support for main image gallery.
  - Implemented auto-scrolling thumbnails.
  - Responsive design: Dots navigation for mobile, arrow navigation for desktop.

### Changed
- Updated `ProductGallery` to utilize the new `ZoomImage` component.
- Improved accessibility with ARIA labels and keyboard support in gallery components.
