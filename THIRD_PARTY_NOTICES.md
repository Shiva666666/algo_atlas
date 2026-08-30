# Third-party UI source notices

The algorithm diagrams and trace engines are custom Algo Atlas code. Two small UI
primitives in `src/visualizers/components/LessonPrimitives.tsx` are source-adapted
from the following MIT-licensed projects, retaining their interaction patterns
while replacing Tailwind styling with this project's CSS and adding accessibility
and reduced-motion behavior. These are not full library installations.

## Bklit UI

Copyright (c) 2026 uixmat

- Project: https://github.com/bklit/bklit-ui
- Adapted sources: `packages/ui/src/charts/legend/legend.tsx`,
  `legend-item.tsx`, and `legend-marker.tsx`.
- Local adaptation: `StateLegend` (item mapping, marker, hovered-item emphasis).

## Kokonut UI

Copyright (c) 2025 kokonutUI

- Project: https://github.com/kokonut-labs/kokonutui
- Adapted source: `components/kokonutui/smooth-tab.tsx`.
- Local adaptation: `SmoothTabs` (measured active background and Motion spring).

## MIT License (applies to both source adaptations above)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

## Runtime dependency

Motion for React is installed as the `motion` dependency and imported through
`motion/react`. Its package includes its own license. No Motion source was copied
into this repository. Documentation: https://motion.dev/docs/react
