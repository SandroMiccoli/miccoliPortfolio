# ELO — Product & Roadmap

## 1. Vision

**ELO (Effect Linked Operators)** is a modular visual instrument for creating generative and reactive geometric visuals.

The core idea is simple: instead of building a visual through a monolithic shader with dozens of parameters, the image is constructed through **ELOs** — visual operators connected in a specific sequence.

An **Elo always connects one thing to another**.

Each Elo receives visual data, transforms it, and passes the result to the next Elo.

```text
Generator → Effect → Effect → Color → Output
```

A sequence of connected Elos forms an **ELOS**.

The system should remain fast to experiment with, immediate to manipulate, and expressive enough to become a performance instrument.

The fundamental interaction should always be:

> **Create → modulate → combine → perform.**

ELO is not intended to reproduce the architecture of a traditional synthesizer. Its “instrument” metaphor comes from the way simple, composable units can be combined, modulated, saved, and performed in real time.

---

## 2. Core Model

### ELO

An **Elo** is a modular visual processing unit.

It represents one operation in the visual signal chain and connects an input to an output.

For example:

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

An Elo can be created, configured, bypassed, duplicated, reordered, and connected to another Elo.

### ELOS

An **ELOS** is a sequence of connected Elos that forms a complete visual process.

```text
Lines
  ↓
Warp
  ↓
Kaleidoscope
  ↓
Color Lookup
  ↓
Screen
```

The sequence itself is the visual instrument's basic building block.

Multiple Elos can be combined into different Elos configurations, duplicated, renamed, activated, and eventually performed.

The collection of available Elos and their configurations becomes the user's visual vocabulary.

### Operators

Operators are the implementation model behind Elos.

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
for operator in elo.operators:
    texture = operator.process(texture)
```

Adding an operator should not require changing the execution architecture.

The user interacts with **Elos**; the system implements them as **operators**.

---

## 3. Modulation

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

The modulation system should remain independent from the ELO document itself. Modulation is resolved at runtime and must never overwrite the stored parameter value.

This distinction is fundamental:

**The ELO stores the instrument. The modulation system performs it.**

A stored ELO configuration describes what has been built.

Runtime modulation describes what is happening now.

---

## 4. Current Operator Vocabulary

Shipped Elos in the live instrument.

### Generators

**Lines** — geometric stripe field.

**Noise** — procedural value-noise field.

**Shape** — circle or regular polygon.

**Gradient** — linear, radial, or sweep color field.

**Camera Input** — live camera texture.

### Effects

**Warp** — UV distortion. Tile (Hold / Repeat / Mirror) fills the frame when UVs leave the image.

**Transform** — translate, rotate, and scale. Same Tile modes as Warp.

**Kaleidoscope** — radial mirroring.

**Displace** — self-mapped pixel offset. Same Tile modes as Warp.

**Feedback** — decaying trail.

**Glitch** — quantized strips with spectrum smear. Same Tile modes as Warp.

**Pixelate** — snaps the image to a coarse pixel grid.

**Mirror** — fold or flip across a line. Same Tile modes as Warp.

**Tile** — repeats the image across the frame. Same Tile modes as Warp.

### Filters

**Bloom** — glow around bright areas.

**Blur** — two-pass Gaussian.

**Edge** — Sobel outlines from luminance gradients.

### Color

**Color Lookup** — maps luminance to a palette.

**Color Ramp** — maps luminance through authored color notches, with phase, period, and linear/step interpolation.

**HSV** — hue, saturation, and value grade.

**Levels** — input/output range and gamma.

**Contrast** — contrast, brightness, and pivot.

**Posterize** — cuts color into a few steps, RGB or luma.

**Invert** — RGB, luma, or hue invert.

### Output

**Screen** — displays the current texture.

This vocabulary should grow organically around the same Elo-based signal-chain model. Desired Elos live in Phase 3 and are ordered by how much new visual territory they open.

---

# 5. Product Architecture

The architecture should preserve three independent layers:

```text
PATCH
  ↓
ELOS / OPERATORS
  ↓
RUNTIME
  ↓
OUTPUT
```

The patch describes **what exists**.

The ELOS describe **how visual operations are connected**.

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
ELO
  ↓
Renderer
```

The phone controls the instrument; it does not need to render the visual.

---

# 6. Roadmap

**Status:** Phase 1 complete. Phase 2 complete. Phase 3 ongoing. Phase 4 onward not started.

## Phase 1 — Make the Instrument Complete

**Complete.** The existing ELO model is useful enough to function as a visual instrument.

### Mapping — done

Output mapping is an output-stage concern, not an Elo.

Shipped:

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

Later expansions (not Phase 1 blockers):

* Perspective Warp
* Bézier Warp

### Masks — done

Output masks are stackable and independent from mapping.

Shipped:

* Rectangle
* Circle

```text
Output
  ↓
Mask
  ↓
Mask
  ↓
Mapping
```

Later expansions (not Phase 1 blockers):

* Bézier shapes
* arbitrary vector masks

### DEBUG / SYSTEM — done

A persistent system overlay renders above the visual output when enabled.

It exposes runtime information such as:

* FPS
* CPU
* rendering information
* system state

The overlay is never part of the rendered visual texture.

---

# 7. Phase 2 — Parameter System

**Complete.** Elos can store and recall parameter configurations independently from performance state.

## Operator Presets

Every operator can save and recall parameter configurations.

Example:

```text
Warp
├── Soft
├── Heavy
├── Liquid
└── Broken
```

Presets store operator parameters, not runtime modulation state.

A preset therefore describes:

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

# 8. Phase 3 — Expand the Visual Vocabulary

**Ongoing.** The parameter architecture is stable. The operator library keeps growing. This phase does not close: new Elos are added according to how much new visual territory they create, not to inflate the catalog.

Each new operator should be evaluated by how effectively it becomes a new **Elo** in the visual vocabulary.

## Desired Elos (priority)

Ordered by new visual territory first. Compositing Elos on this list are vocabulary; multi-ELOS compositing architecture is Phase 4.

| Pri | Elo | Category | Why it is next |
| --- | --- | --- | --- |
| 1 | **Particles** | Generator | New motion language. Fields, trails, and organic structure that geometry generators cannot produce. |
| 2 | **Video** | Generator | A second timed source besides Camera. File and stream input for performable footage. |
| 3 | **Blend** | Compositing | First true mix Elo. Unlocks combining two textures and is the bridge into Phase 4. |
| 4 | **Mask** | Compositing | Spatial mix as an Elo, independent from output masks. Reveals, holes, and layered forms inside the chain. |
| 5 | **Add** | Compositing | Dedicated additive mix. May later collapse into Blend modes if Blend covers it well. |
| 6 | **Multiply** | Compositing | Dedicated multiplicative mix. Same note as Add. |
| 7 | **Texture** | Output | Named render target. Lets an ELOS write somewhere other than Screen. |
| 8 | **Syphon / Spout** | Output | Desktop visual interop. Share the image with other performance software. |
| 9 | **NDI** | Output | Network video out. Same patch, another destination. |

Revisit this table whenever a new Elo is proposed. Promote, demote, or drop items based on territory, not count.

---

# 9. Phase 4 — Compositing

**Not started.** The current system is a single texture chain.

The next conceptual expansion is combining multiple visual sources.

For example:

```text
ELOS A
Lines
  ↓
Warp
  ↓
Color
  ↓
      ┐
      ├── Blend → Output
      │
ELOS B
Noise
  ↓
Kaleidoscope
  ↓
Color
```

This introduces a second meaning for connection: an Elo does not necessarily have to connect only to the immediately previous operation.

The system can eventually support multiple visual sources converging into a compositing operation.

The existing operator architecture should already make this possible because operators are based around input/output textures.

---

# 10. Phase 5 — From Linear ELOS to a Graph

**Not started.** The linear ELOS model should remain the primary interaction model for as long as possible.

Eventually, however, multiple inputs and compositing create situations where a linear sequence becomes insufficient.

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

This should be an evolution of the existing ELO system, not a rewrite.

The concept remains the same: **ELO means connection**.

The visual graph is simply a more expressive form of connected Elos.

Operators should remain unaware of whether their input comes from:

* the previous operator in an ELOS;
* another ELOS;
* a graph connection;
* a texture source.

The execution model should absorb this complexity.

---

# 11. Performance

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

ELOS thumbnails should remain based on actual rendered output while using reduced-resolution buffers.

**Runtime monitoring**

DEBUG/SYSTEM should provide enough information to identify expensive operators and rendering bottlenecks.

---

# 12. Remote Performance

The mobile controller should eventually become more than a remote configuration interface.

The system already supports:

```text
Phone
  ↓
WebSocket
  ↓
ELO
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

# 13. Performance Model

The system should increasingly distinguish between **authoring** and **performance**.

### Authoring

```text
Create ELOS
Add Elos
Tune parameters
Save presets
Build visual systems
```

### Performance

```text
Activate ELOS
Switch ELOS
Modulate parameters
Change BPM
React to audio
Control remotely
```

The interface should eventually make this distinction explicit.

A good visual instrument should allow the user to stop thinking about implementation and start performing.

---

# 14. Long-Term Operator Taxonomy

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

Not every ELOS needs every category.

A valid ELOS could be:

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

# 15. Product Principles

### 1. The ELOS are the instrument

The power of ELO should come from connecting simple operators rather than making individual operators excessively complex.

### 2. Every Elo connects

An Elo exists as part of a relationship between an input and an output.

Connection is the fundamental organizing principle of the system.

### 3. Modulation should be universal

If a parameter exists, it should eventually be possible to modulate it.

### 4. Runtime state must not destroy authoring state

Performance should never overwrite the underlying patch.

### 5. Operators should remain composable

An operator should not care where its input comes from or where its output goes.

### 6. The GPU does the work

Visual processing should happen where it is most efficient.

### 7. Immediate feedback

Every meaningful interaction should produce an immediate visual response.

### 8. Complexity should emerge from combination

Prefer ten simple operators that connect well over one operator with fifty unrelated controls.

### 9. The system should remain performable

ELO is not only a visual programming environment.

It is a **modular visual instrument**.

The interface, timing system, modulation, presets and remote control should ultimately support live visual performance.

---

# 16. Current Priority

Phase 1 and Phase 2 are done. Immediate work:

```text
New Operators (Phase 3, ongoing)
      ↓
Compositing
      ↓
Multi-input Processing
      ↓
Graph Architecture
```

Next Elo to ship: **Particles**, then **Video**, then **Blend**.

The strategic objective is not to add features as quickly as possible.

It is to progressively transform the existing visual effect system into **ELO — a complete modular visual instrument built from Effect Linked Operators**.

The core abstraction is no longer the pipeline.

It is the **Elo**:

> **An Elo connects one thing to another.**

A sequence of connected Elos forms an **ELOS**.

Together, they form the instrument.
