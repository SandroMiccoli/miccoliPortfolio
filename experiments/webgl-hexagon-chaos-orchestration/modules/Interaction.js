/**
 * Mouse interaction with framerate-independent smoothing.
 *
 * Tracks raw cursor position in normalized [0, 1] coords and exposes a
 * smoothed value used by the shader. Activity ramps up on first move and
 * decays back when the cursor leaves the window — providing the "magnetic"
 * feeling described in the project brief.
 */

export function createInteraction(target, params) {
	const raw = { x: 0.5, y: 0.5 };
	const smooth = { x: 0.5, y: 0.5 };
	let active = 0;
	let activeTarget = 0;
	let everMoved = false;

	function onPointerMove(e) {
		const rect = target.getBoundingClientRect();
		raw.x = (e.clientX - rect.left) / rect.width;
		raw.y = 1.0 - (e.clientY - rect.top) / rect.height;
		activeTarget = 1;
		if (!everMoved) {
			smooth.x = raw.x;
			smooth.y = raw.y;
			everMoved = true;
		}
	}

	function onPointerLeave() {
		activeTarget = 0;
	}

	function onTouchMove(e) {
		if (e.touches.length === 0) return;
		onPointerMove(e.touches[0]);
	}

	function onTouchEnd() {
		activeTarget = 0;
	}

	target.addEventListener('pointermove', onPointerMove, { passive: true });
	target.addEventListener('pointerleave', onPointerLeave, { passive: true });
	target.addEventListener('touchmove', onTouchMove, { passive: true });
	target.addEventListener('touchend', onTouchEnd, { passive: true });

	function dispose() {
		target.removeEventListener('pointermove', onPointerMove);
		target.removeEventListener('pointerleave', onPointerLeave);
		target.removeEventListener('touchmove', onTouchMove);
		target.removeEventListener('touchend', onTouchEnd);
	}

	/**
	 * Advance the smoothed mouse / activity values one frame.
	 * @param {number} dt seconds since last frame
	 */
	function update(dt) {
		const easing = clamp(params.easingAmount, 0.0001, 1);
		const snap = clamp(params.snapBackSpeed, 0.0001, 1);

		// Half-life style smoothing: each frame approaches the target by `1-e^(-dt*k)`.
		const moveK = easing * 12;
		const moveT = 1 - Math.exp(-dt * moveK);
		smooth.x += (raw.x - smooth.x) * moveT;
		smooth.y += (raw.y - smooth.y) * moveT;

		const actK = (activeTarget > active ? easing : snap) * 5;
		const actT = 1 - Math.exp(-dt * actK);
		active += (activeTarget - active) * actT;
		if (active < 1e-4) active = 0;
	}

	function get() {
		return { x: smooth.x, y: smooth.y, active };
	}

	return { update, get, dispose };
}

function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}
