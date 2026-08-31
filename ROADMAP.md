# ELO — Product & Roadmap

## 1. Vision

**ELO (Effect Linked Operators)** is a modular visual instrument for creating generative and reactive geometric visuals.

The core idea is simple: instead of building a visual through a monolithic shader with dozens of parameters, the image is constructed by connecting **operators** in a specific sequence.

An **operator always connects one thing to another**.

Each operator receives visual data, transforms it, and passes the result to the next operator.

```text
Generator → Effect → Effect → Color → Output
```

A sequence of connected operators forms a **chain** — the consolidated visual.

The system should remain fast to experiment with, immediate to manipulate, and expressive enough to become a performance instrument.

The fundamental interaction should always be:

> **Create → modulate → combine → perform.**

ELO is not intended to reproduce the architecture of a traditional synthesizer. Its “instrument” metaphor comes from the way simple, composable units can be combined, modulated, saved, and performed in real time.

---

## 2. Core Model

### Operator

An **operator** is a modular visual processing unit.

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

An operator can be created, configured, bypassed, duplicated, reordered, and connected to another operator.

### Chain

A **chain** is a sequence of connected operators that forms a complete visual — the consolidated effect.

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

The chain itself is the visual instrument's basic building block.

Multiple operators can be combined into different chains, duplicated, renamed, activated, and eventually performed.

The collection of available operators and their chains becomes the user's visual vocabulary.

### Execution

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
for operator in chain.operators:
    texture = operator.process(texture)
```

Adding an operator should not require changing the execution architecture.

The user interacts with **operators** connected into **chains**.

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

Shipped operators in the live instrument.

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

This vocabulary should grow organically around the same operator-chain model. New generators, outputs, and operators after 0.1.0-beta are ordered by how much new visual territory they open.

---

# 5. Product Architecture

The architecture should preserve three independent layers:

```text
PATCH
  ↓
CHAIN / OPERATORS
  ↓
RUNTIME
  ↓
OUTPUT
```

The patch describes **what exists**.

The chain describes **how visual operations are connected**.

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

**Status:** 0.1.0-beta is the initial release / MVP. Architecture below is the launch target. After launch: composition operators first, then new sources, professional video I/O, and expressive remote control.

---

## Version 0.1.0-beta — Initial Release

This version defines the ELO MVP. It establishes the visual instrument's foundation by unifying the **linear rendering engine** with the first **composition and reuse** architecture.

The linear chain remains the interaction model. Composition happens without a node graph.

### Stable Linear Engine

Fluid execution of operators — Generators, Effects, Filters, Color — designed to run in browsers and on mobile devices.

```text
for operator in chain.operators:
    texture = operator.process(texture)
```

Adding an operator should not require changing the execution architecture.

### Modulation System

Parameters react to BPM and audio signals (FFT), fully independent of the state saved in the patch.

The ELO stores the instrument. The modulation system performs it.

### State Management

Save, load, and switch between:

* operator presets
* complete chain configurations

Presets store operator parameters, not runtime modulation state.

A preset therefore describes:

```text
parameter values
```

rather than:

```text
parameter values + current BPM phase + FFT state
```

The same preset can behave differently depending on the performance context.

### Output Mapping and Masks

Output mapping is an output-stage concern, not an operator.

**Corner Pin** — 4-point perspective deformation of the final image.

**Masks** — stackable and independent from mapping.

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

Later expansions (not 0.1.0-beta blockers):

* Perspective Warp
* Bézier Warp
* Bézier / arbitrary vector masks

### DEBUG / SYSTEM

A persistent system overlay renders above the visual output when enabled.

It exposes runtime information such as FPS, CPU, rendering information, and system state.

The overlay is never part of the rendered visual texture.

### Chain Reuse (Sub-patching)

A new operator inserts a previously saved chain into a new chain as a single block.

```text
[ Saved chain ]
      ↓
[ Warp ]
      ↓
[ Color Lookup ]
      ↓
[ Screen ]
```

The nested chain is one operator in the parent chain. Internally it is still a sequence of operators.

### Secondary Inputs via Parameter

Operators that need a second map — Displace, Blend, and similar — expose a simple dropdown in the UI to pull the texture from another existing chain.

No node graph.

```text
Chain A (main chain)              Chain B (texture source)
Lines                            Noise
  ↓                                ↓
Warp                             Kaleidoscope
  ↓
Displace  ←── dropdown ────────── output
  ↓
Screen
```

The secondary input is a parameter, not a visual cable.

### Internal Dependency Resolver

The rendering core calculates execution order behind the scenes.

It resolves nested chains (sub-patches) and secondary texture sources before processing the main chain.

```text
1. Resolve nested chains
2. Resolve secondary texture sources
3. Execute the main chain
```

Operators stay unaware of whether their input comes from the previous operator, a nested chain, or another chain selected in a dropdown. The executor absorbs that complexity.

---

# 7. Next Steps — Continuous Evolution

With the central architecture established in 0.1.0-beta, development first **validates composition**, then expands sources and professional video I/O.

Priority is fluid. The table below is the current order.

### Composition Operators

The first operators after launch exist to prove the secondary-input architecture in real patches.

**Blend** — the first operator to make real use of the secondary-input dropdown, opening the composition era.

**Mask** — spatial cuts inside the chain, using other chains as reference, independent from output masks.

**Add** / **Multiply** — dedicated mix operators. Useful for testing multi-input stability. May later collapse into Blend modes.

### New Generator Sources

Organic and temporal generators, after composition is proven:

**Video** — file and stream input. A second timed source besides Camera, for performable footage.

**Particles** — GPU-based particle fields, trails, and organic structure that geometry generators cannot produce. GPU work is required to keep performance viable. Moved below composition so it does not delay architecture validation.

### Professional Video Communication

Integration with VJ software and networks:

**Syphon / Spout** — same-computer texture exchange with other performance software.

**NDI** — send video over the network. Same patch, another destination.

### Remote Control Evolution

Expand WebSocket so the phone becomes an expressive live controller, not only a remote configuration UI.

Control sources:

* touch
* accelerometer
* gyroscope

These signals modulate parameters in real time. Visual rendering remains on the main machine.

### Continuous Vocabulary Expansion

Organic addition of new effect and color operators, always evaluated by their potential to create new visual territories — not to inflate the catalog.

Each new operator should earn a place in the visual vocabulary.

## Desired operators (priority)

| Pri | Operator | Category | Why it is next |
| --- | --- | --- | --- |
| 1 | **Blend** | Compositing | First operator to make real use of the secondary-input dropdown from 0.1.0-beta, opening the composition era. |
| 2 | **Mask** | Compositing | Spatial cuts inside the chain using other chains as reference, independent from output masks. |
| 3 | **Add** | Compositing | Dedicated additive mix. Tests multi-input flow stability. May later be absorbed by Blend. |
| 4 | **Multiply** | Compositing | Dedicated multiplicative mix. Same logic as Add. |
| 5 | **Video** | Generator | Timed source besides Camera. After composition, still essential for expanding sources. |
| 6 | **Particles** | Generator | New motion language. Below composition so it does not delay architecture validation. |
| 7 | **Texture** | Output | Named render target. Lets a chain write somewhere other than Screen. |
| 8 | **Syphon / Spout** | Output | Desktop interop. Connect ELO to software such as Resolume or TouchDesigner. |
| 9 | **NDI** | Output | Network video out. The same patch sending image to other devices. |

Revisit this table whenever a new operator is proposed. Promote, demote, or drop items based on territory, not count.

---

# 8. Later Evolution — From Linear Chains to a Graph

The linear chain model remains the primary interaction model for as long as possible.

0.1.0-beta already combines multiple sources through sub-patching and dropdown secondary inputs. A visual graph is not required for that.

Eventually, however, nested reuse and multi-input operators may create situations where a linear sequence becomes insufficient.

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

The visual graph is simply a more expressive form of connected operators.

Operators should remain unaware of whether their input comes from:

* the previous operator in a chain;
* a nested chain (sub-patch);
* another chain selected as a secondary input;
* a graph connection;
* a texture source.

The execution model should absorb this complexity.

---

# 9. Performance

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

Chain thumbnails should remain based on actual rendered output while using reduced-resolution buffers.

**Runtime monitoring**

DEBUG/SYSTEM should provide enough information to identify expensive operators and rendering bottlenecks.

---

# 10. Remote Performance

The mobile controller should become more than a remote configuration interface.

The system already supports:

```text
Phone
  ↓
WebSocket
  ↓
ELO
```

After 0.1.0-beta, the WebSocket layer expands so the phone is an expressive physical controller.

Control sources:

* touch
* accelerometer
* gyroscope
* microphone / FFT
* BPM
* gestures

The visual rendering remains on the main machine.

---

# 11. Performance Model

The system should increasingly distinguish between **authoring** and **performance**.

### Authoring

```text
Create chain
Add operators
Tune parameters
Save presets
Build visual systems
```

### Performance

```text
Activate chain
Switch chains
Modulate parameters
Change BPM
React to audio
Control remotely
```

The interface should eventually make this distinction explicit.

A good visual instrument should allow the user to stop thinking about implementation and start performing.

---

# 12. Long-Term Operator Taxonomy

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

Not every chain needs every category.

A valid chain could be:

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

# 13. Product Principles

### 1. The chains are the instrument

The power of ELO should come from connecting simple operators rather than making individual operators excessively complex.

### 2. Every operator connects

An operator exists as part of a relationship between an input and an output.

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

# 14. Current Priority

Immediate work is the 0.1.0-beta MVP:

```text
Stable linear engine
      ↓
Sub-patching (chain reuse)
      ↓
Secondary inputs via parameter
      ↓
Internal dependency resolver
```

After launch, continuous evolution:

```text
Blend → Mask → Add → Multiply
      ↓
Video → Particles
      ↓
Texture → Syphon / Spout → NDI
      ↓
Expressive remote control
      ↓
New effect and color operators
```

A visual node graph is not on the launch path. Composition in 0.1.0-beta is sub-patching plus dropdown secondary inputs.

The strategic objective is not to add features as quickly as possible.

It is to progressively transform the existing visual effect system into **ELO — a complete modular visual instrument built from Effect Linked Operators**.

The core abstraction is no longer the pipeline.

It is the **chain of operators**:

> **An operator connects one thing to another.**

A sequence of connected operators forms a **chain** — the consolidated visual.

Together, they form the instrument.
