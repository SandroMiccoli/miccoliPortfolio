# Visual Synth — Product & Roadmap

## 1. Vision

**Visual Synth** is a modular visual instrument for creating generative and reactive geometric visuals.

The core idea is simple: instead of building a visual through a monolithic shader with dozens of parameters, the image is constructed through **PIPEs** — linear chains of visual operators.

Each operator receives an input texture, transforms it, and passes the result to the next operator.

```text
Generator → Effect → Effect → Color → Output
```

This creates a visual workflow closer to a **synthesizer signal chain** or a **VJ effects stack** than to a node-based programming environment.

The system should remain fast to experiment with, immediate to manipulate, and expressive enough to become a performance instrument.

The fundamental interaction should always be:

> **Create → modulate → combine → perform.**

---

## 2. Core Model

### PIPE

A PIPE is the fundamental visual unit.

It contains an ordered stack of operators:

```text
[ Lines ]
    ↓
[ Warp ]
    ↓
[ Kaleidoscope ]
    ↓
[ Color Lookup ]
    ↓
[ Screen ]
```

The order is meaningful.

`Lines → Warp` produces a different visual process from `Warp → Lines`.

PIPEs can be created, duplicated, renamed, deleted and activated.

The grid of PIPEs represents the user's collection of visual patches and eventually becomes the primary performance surface.

### Operators

Operators are modular processing units.

Each operator should:

* receive an input texture when applicable;
* expose parameters;
* process its input;
* produce an output texture;
* support bypass;
* support parameter modulation;
* be independently reusable.

The executor should remain generic:

```text
for operator in pipe.operators:
    texture = operator.process(texture)
```

Adding an operator should not require changing the execution architecture.

### Modulation

Parameters are not only static values.

Any parameter can become a continuously changing signal driven by:

```text
Speed
BPM
FFT
```

The modulation system maps a normalized 0–1 signal into the parameter's range.

```text
source → remap → parameter
```

The modulation system should remain independent from the PIPE document itself. Modulation is resolved at runtime and must never overwrite the stored parameter value.

This distinction is fundamental:

**The patch stores the instrument. The modulation system performs it.**

---

## 3. Current Operator Vocabulary

### Generators

**Lines** — geometric stripe field.

**Noise** — procedural value-noise field.

**Camera Input** — live camera texture.

### Effects

**Warp** — UV distortion.

**Kaleidoscope** — radial mirroring.

**Bloom** — glow around bright areas.

**Edge** — Sobel outlines from luminance gradients.

### Color

**Color Lookup** — maps luminance to a palette.

### Output

**Screen** — displays the current texture.

This vocabulary should grow organically around the same signal-chain model.

---

# 4. Product Architecture

The architecture should preserve three independent layers:

```text
PATCH
  ↓
PIPE / OPERATORS
  ↓
RUNTIME
  ↓
OUTPUT
```

The patch describes **what exists**.

The runtime describes **what is happening now**.

The output describes **where the image goes**.

This separation is especially important because the same patch must work across different environments:

```text
Browser / Lab
      ↓
Raspberry Pi Kiosk
      ↓
Physical Output / Projection
```

Remote control should remain a separate interface:

```text
Phone
  ↓ WebSocket
Visual Synth
  ↓
Renderer
```

The phone controls the system; it does not need to render the visual.

---

# 5. Roadmap

## Phase 1 — Make the Instrument Complete

The immediate goal is to make the existing PIPE model useful enough to function as a complete visual instrument.

### Mapping

Introduce an output mapping stage.

First implementation:

**Corner Pin**

```text
┌──────────────┐
│              │
│    IMAGE     │
│              │
└──────────────┘

        ↓

     4-point
   perspective
   deformation
```

The mapping system should eventually support:

* Corner Pin
* Perspective Warp
* Bézier Warp

Mapping belongs to the output stage rather than individual visual operators.

### Masks

Add output masks.

First:

* Rectangle
* Circle

Masks should be stackable.

```text
Output
  ↓
Mask
  ↓
Mask
  ↓
Mapping
```

Later:

* Bézier shapes
* arbitrary vector masks

Masks should be reusable independently from mapping.

### DEBUG / SYSTEM

Add a persistent system overlay.

When enabled, DEBUG/SYSTEM must always render above the visual output.

It should expose runtime information such as:

* FPS
* CPU
* rendering information
* system state

The overlay must never become part of the rendered visual texture.

---

# 6. Phase 2 — Parameter System

The next major capability is turning operators into reusable instruments rather than fixed effects.

## Operator Presets

Every operator should be able to save and recall parameter configurations.

Example:

```text
Warp
├── Soft
├── Heavy
├── Liquid
└── Broken
```

Presets should store operator parameters, not runtime modulation state.

A preset should therefore describe:

```text
parameter values
```

rather than:

```text
parameter values + current BPM phase + FFT state
```

The modulation system remains external.

This distinction allows the same preset to behave differently depending on the performance context.

---

# 7. Phase 3 — Expand the Visual Vocabulary

Once the parameter architecture is stable, expand the operator library.

## Generators

```text
Gradient
Particles
Video
```

## Effects

```text
Displace
Blur
Feedback
```

## Color

```text
Hue / Saturation
Levels
Contrast
```

## Compositing

```text
Blend
Mask
Add
Multiply
```

## Output

```text
Texture
Syphon / Spout
NDI
```

Operators should be added according to how much new visual territory they create, not simply to increase the number of available effects.

---

# 8. Phase 4 — Compositing

The current system is fundamentally a single texture chain.

The next conceptual expansion is combining multiple visual sources.

For example:

```text
PIPE A
Lines
  ↓
Warp
  ↓
Color
  ↓
      ┐
      ├── Blend → Output
      │
PIPE B
Noise
  ↓
Kaleidoscope
  ↓
Color
```

This is the point where compositing becomes important.

The existing operator architecture should already make this possible because operators are based around input/output textures.

---

# 9. Phase 5 — From PIPEs to a Graph

The linear PIPE model should remain the primary interaction model for as long as possible.

Eventually, however, multiple inputs and compositing create situations where a linear stack becomes insufficient.

The long-term architecture can therefore evolve from:

```text
A → B → C → D
```

into:

```text
       ┌→ B ──┐
A ─────┤      ├→ D
       └→ C ──┘
```

This should be an evolution of the existing system, not a rewrite.

Operators should remain unaware of whether their input comes from:

* the previous operator in a PIPE;
* another PIPE;
* a graph connection;
* a texture source.

The execution model should absorb this complexity.

---

# 10. Performance

Performance is a product feature, not an implementation detail.

The same patch should be capable of running in:

```text
Desktop browser
        ↓
Development / Lab
        ↓
Raspberry Pi kiosk
```

Performance work should therefore prioritize:

**GPU processing**

Operators should remain GPU-oriented whenever possible.

**Texture efficiency**

Avoid unnecessary framebuffer allocations and texture copies.

**Preview efficiency**

PIPE thumbnails should remain based on actual rendered output while using reduced-resolution buffers.

**Runtime monitoring**

DEBUG/SYSTEM should provide enough information to identify expensive operators and rendering bottlenecks.

---

# 11. Remote Performance

The mobile controller should eventually become more than a remote configuration interface.

The system already supports:

```text
Phone
  ↓
WebSocket
  ↓
Visual Synth
```

The long-term goal is a performance interface where the phone becomes a physical controller for the visual instrument.

Potential control sources include:

* touch
* accelerometer
* gyroscope
* microphone / FFT
* BPM
* gestures

The visual rendering remains on the main machine.

---

# 12. Performance Model

The system should increasingly distinguish between **authoring** and **performance**.

Authoring:

```text
Create PIPE
Add operators
Tune parameters
Save presets
Build visual system
```

Performance:

```text
Activate PIPE
Switch PIPE
Modulate parameters
Change BPM
React to audio
Control remotely
```

The interface should eventually make this distinction explicit.

A good visual instrument should allow the user to stop thinking about implementation and start performing.

---

# 13. Long-Term Operator Taxonomy

The operator library should converge toward a consistent vocabulary:

```text
GENERATOR
    ↓
TRANSFORM
    ↓
EFFECT
    ↓
COLOR
    ↓
COMPOSITE
    ↓
OUTPUT
```

Not every PIPE needs every category.

A valid PIPE could be:

```text
Noise → Warp → Screen
```

or:

```text
Camera → Kaleidoscope → Color → Bloom → Screen
```

or eventually:

```text
Particles
    ↓
Displace
    ↓
Feedback
    ↓
Color
    ↓
Blend
    ↓
Output
```

The system should encourage experimentation without forcing a rigid recipe.

---

# 14. Product Principles

### 1. The stack is the instrument

The power of Visual Synth should come from combining simple operators rather than making individual operators excessively complex.

### 2. Modulation should be universal

If a parameter exists, it should eventually be possible to modulate it.

### 3. Runtime state must not destroy authoring state

Performance should never overwrite the underlying patch.

### 4. Operators should remain composable

An operator should not care where its input comes from or where its output goes.

### 5. The GPU does the work

Visual processing should happen where it is most efficient.

### 6. Immediate feedback

Every meaningful interaction should produce an immediate visual response.

### 7. Complexity should emerge from combination

Prefer ten simple operators that combine well over one operator with fifty unrelated controls.

### 8. The system should remain performable

Visual Synth is not only a visual programming environment.

It is an **instrument**.

The interface, timing system, modulation, presets and remote control should ultimately support live visual performance.

---

# 15. Current Priority

The immediate roadmap is:

```text
DEBUG / SYSTEM
      ↓
Corner Pin Mapping
      ↓
Masks
      ↓
Operator Presets
      ↓
New Operators
      ↓
Compositing
      ↓
Multi-input Processing
      ↓
Graph Architecture
```

The strategic objective is not to add features as quickly as possible.

It is to progressively transform the existing PIPE system from a **visual effect builder** into a **complete visual instrument**.
