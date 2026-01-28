const symbols = [
    '💫', '✨', '⭐', '❤️', '❤️‍🔥', '🔥',
    '🎲', '🎨', '🤡'
  ];
  
  const prizes = {
    '💫💫💫': 1000,
    '✨✨✨': 1000,
    '⭐⭐⭐': 1000,
    '❤️❤️❤️': 1000,
    '❤️‍🔥❤️‍🔥❤️‍🔥': 1000,
    '🔥🔥🔥': 1000,
    '🎲🎲🎲': 1000,
    '🎨🎨🎨': 1000,
    '🤡🤡🤡': 1000
  };
  
  const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
  ];
  
  const lever = document.getElementById('lever');
  const winDisplay = document.getElementById('winDisplay');
  
  // Create Audio Context for better browser compatibility
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  
  // Musical scales for variety
  const scales = [
    [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], // C Major
    [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 554.37], // D Major
    [329.63, 369.99, 415.30, 440.00, 493.88, 554.37, 622.25], // E Major
    [349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 659.25], // F Major
    [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99]  // G Major
  ];
  
  let currentScaleIndex = 0;
  
  function getRandomScale() {
    currentScaleIndex = (currentScaleIndex + 1 + Math.floor(Math.random() * (scales.length - 1))) % scales.length;
    return scales[currentScaleIndex];
  }
  
  // Enhanced function to play a chord
  function playChord(frequencies, duration, startTime, type = 'sine', gainValue = 0.1) {
    frequencies.forEach(freq => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(gainValue, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }
  
  // Updated "Let's Go" sound pattern using current scale
  function playLetsGoSound() {
    const now = audioContext.currentTime;
    const currentScale = getRandomScale();
    const sequence = [currentScale[0], currentScale[2], currentScale[4]]; // Root, Third, Fifth
    
    sequence.forEach((freq, i) => {
      playChord([freq], 0.15, now + i * 0.2, 'triangle', 0.2);
    });
  }
  
  // Updated "Lose" sound using current scale
  function playLoseSound() {
    const now = audioContext.currentTime;
    const currentScale = scales[currentScaleIndex];
    const loseChord = [
      currentScale[0],
      currentScale[0] * Math.pow(2, 3/12), // Minor third
      currentScale[4]
    ];
    
    playChord(loseChord, 0.4, now, 'sine', 0.15);
  }
  
  // Updated "Win" sound using current scale
  function playWinSound() {
    const now = audioContext.currentTime;
    const currentScale = scales[currentScaleIndex];
    
    // More complex chord progression
    const chord1 = [currentScale[0], currentScale[2], currentScale[4]];
    const chord2 = [currentScale[3], currentScale[5], currentScale[0]];
    const chord3 = [currentScale[4], currentScale[6], currentScale[1]];
    const finalChord = [currentScale[0], currentScale[2], currentScale[4], currentScale[6]];
    
    // Play initial celebratory chords
    playChord(chord1, 0.4, now, 'sine', 0.15);
    playChord(chord2, 0.4, now + 0.4, 'sine', 0.15);
    playChord(chord3, 0.4, now + 0.8, 'sine', 0.15);
    
    // Add triumphant arpeggios
    for(let i = 0; i < 3; i++) {
      setTimeout(() => {
        const arpeggio = [currentScale[0], currentScale[2], currentScale[4], currentScale[6]];
        arpeggio.forEach((note, j) => {
          setTimeout(() => {
            playChord([note], 0.2, audioContext.currentTime, 'sine', 0.12);
          }, j * 80);
        });
      }, 1200 + (i * 400));
    }
    
    // Grand finale
    setTimeout(() => {
      playChord(finalChord, 1.0, audioContext.currentTime, 'sine', 0.25);
      
      // Add sparkle effects
      for(let i = 0; i < 5; i++) {
        setTimeout(() => {
          playChord([2000 + Math.random() * 2000], 0.1, audioContext.currentTime, 'sine', 0.05);
        }, i * 100);
      }
    }, 2600);
  }
  
  function playGlitchSound() {
    const now = audioContext.currentTime;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Add randomization to frequency range
    const startFreq = 150 + Math.random() * 100; // Random start between 150-250Hz
    const endFreq = 500 + Math.random() * 200;   // Random end between 500-700Hz
    
    // Randomly choose oscillator type
    const types = ['sawtooth', 'square'];
    oscillator.type = types[Math.floor(Math.random() * types.length)];
    
    // Random duration between 0.08 and 0.15 seconds
    const duration = 0.08 + Math.random() * 0.07;
    
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.linearRampToValueAtTime(endFreq, now + duration);
    
    // Random volume between 0.08 and 0.12
    const volume = 0.08 + Math.random() * 0.04;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
  
  let isSpinning = false;
  
  function playStopReelNote(reelIndex) {
    const now = audioContext.currentTime;
    const currentScale = scales[currentScaleIndex];
    
    // Use root, third, and fifth notes for each reel stop
    const notes = [
      currentScale[0], // Root note for first reel
      currentScale[2], // Third note for second reel 
      currentScale[4]  // Fifth note for third reel
    ];
  
    playChord([notes[reelIndex]], 0.2, now, 'sine', 0.15);
  }
  
  function animateSymbols(reel) {
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      if (!reel.classList.contains('spinning')) {
        clearInterval(spinInterval);
        return;
      }
      reel.querySelector('.reel-container').innerHTML = symbols[Math.floor(Math.random() * symbols.length)];
      spinCount++;
    }, 200);
  }
  
  function spin() {
    if (isSpinning) return;
    
    isSpinning = true;
    lever.classList.add('pulled');
    playLetsGoSound();
  
    const results = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
  
    // Start all reels spinning
    setTimeout(() => {
      reels.forEach(reel => {
        reel.classList.add('spinning');
        animateSymbols(reel);
      });
    }, 200);
  
    // Stop reels one by one
    setTimeout(() => {
      lever.classList.remove('pulled');
      
      // Stop first reel
      reels[0].classList.remove('spinning');
      reels[0].querySelector('.reel-container').innerHTML = results[0];
      playStopReelNote(0);
      
      // Stop second reel after 500ms
      setTimeout(() => {
        reels[1].classList.remove('spinning');
        reels[1].querySelector('.reel-container').innerHTML = results[1];
        playStopReelNote(1);
        
        // Stop third reel after another 500ms
        setTimeout(() => {
          reels[2].classList.remove('spinning');
          reels[2].querySelector('.reel-container').innerHTML = results[2];
          playStopReelNote(2);
          
          // Longer delay before final result check and chord
          setTimeout(() => {
            // Check results after all reels have stopped
            const resultString = results.join('');
            let prize = 0;
  
            Object.entries(prizes).forEach(([combination, value]) => {
              if (resultString === combination) {
                prize = value;
                playWinSound();  // Full chord and win sequence
                createFireworks(results[0]);
                reels.forEach(reel => reel.classList.add('prize-flash'));
                
                // Add more particle bursts over time
                for(let burst = 0; burst < 3; burst++) {
                  setTimeout(() => {
                    for(let i = 0; i < 20; i++) {
                      const particle = document.createElement('div');
                      particle.className = 'particle';
                      particle.innerHTML = '✨';
                      particle.style.left = `${Math.random() * 100}%`;
                      particle.style.top = `${Math.random() * 100}%`;
                      document.querySelector('.slot-machine').appendChild(particle);
  
                      setTimeout(() => particle.remove(), 1500);
                    }
                  }, burst * 1000);
                }
              }
            });
  
            if (prize === 0) {
              playLoseSound();
            }
  
            winDisplay.textContent = prize > 0 ? `Winner! ${prize} coins!` : 'Try again!';
  
            setTimeout(() => {
              reels.forEach(reel => reel.classList.remove('prize-flash'));
              isSpinning = false;
            }, 500);
            
          }, 600); // Increased delay before final result
  
        }, 500); // Delay for third reel
      }, 500); // Delay for second reel
    }, 2000); // Initial delay before stopping first reel
  }
  
  // Update the lever click event to use the new spin function
  lever.addEventListener('click', () => {
    if (isSpinning) {
      lever.classList.add('lever-glitch');
      playGlitchSound();
      setTimeout(() => {
        lever.classList.remove('lever-glitch');
      }, 200);
      return;
    }
    
    spin();
  });
  
  // Update the debug win function to include stop reel notes
  document.getElementById('debugWin').addEventListener('click', () => {
    if (isSpinning) return;
    
    isSpinning = true;
    lever.classList.add('pulled');
    playLetsGoSound();
  
    const sparkSymbol = symbols[0];
    const winningCombo = [sparkSymbol, sparkSymbol, sparkSymbol];
  
    setTimeout(() => {
      reels.forEach(reel => {
        reel.classList.add('spinning');
        animateSymbols(reel);
      });
    }, 200);
  
    setTimeout(() => {
      lever.classList.remove('pulled');
      
      // Stop first reel
      reels[0].classList.remove('spinning');
      reels[0].querySelector('.reel-container').innerHTML = winningCombo[0];
      playStopReelNote(0);
      
      // Stop second reel
      setTimeout(() => {
        reels[1].classList.remove('spinning');
        reels[1].querySelector('.reel-container').innerHTML = winningCombo[1];
        playStopReelNote(1);
        
        // Stop third reel
        setTimeout(() => {
          reels[2].classList.remove('spinning');
          reels[2].querySelector('.reel-container').innerHTML = winningCombo[2];
          playStopReelNote(2);
          
          playWinSound();
          reels.forEach(reel => reel.classList.add('prize-flash'));
          winDisplay.textContent = `Winner! 500 coins!`;
          createFireworks(sparkSymbol);
  
          setTimeout(() => {
            reels.forEach(reel => reel.classList.remove('prize-flash'));
            isSpinning = false;
          }, 4500);
        }, 500); // Delay for third reel
      }, 500); // Delay for second reel
    }, 2000); // Initial delay before stopping first reel
  });
  
  // Fireworks functions
  function createFirework(x, y, emoji) {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.setProperty('--x', `${x}px`);
    firework.style.setProperty('--initialY', `${y}px`);
    firework.style.setProperty('--duration', `${0.6 + Math.random() * 0.4}s`);
    firework.innerHTML = emoji; // Use the winning emoji
    document.body.appendChild(firework);
    
    setTimeout(() => firework.remove(), 1000);
  }
  
  function createFireworks(emoji) {
    // Create 3 waves of fireworks
    for(let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        // Create more fireworks per wave
        for(let i = 0; i < 16; i++) {
          setTimeout(() => {
            const x = (Math.random() - 0.5) * 400;
            const y = (Math.random() - 0.5) * 400;
            createFirework(x, y, emoji);
          }, i * 40); // Faster spawning within wave
        }
      }, wave * 800); // Delay between waves
    }
  }
  
  // Initialize debug button visibility state
  const debugBtn = document.getElementById('debugWin');
  debugBtn.style.display = 'none';
  
  // Add keyboard shortcut listener
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      debugBtn.style.display = debugBtn.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  // Add mobile shake detection
  let lastUpdate = 0;
  let lastX, lastY, lastZ;
  const SHAKE_THRESHOLD = 15;
  
  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', (event) => {
      const current = Date.now();
      if ((current - lastUpdate) > 100) {
        const diffTime = current - lastUpdate;
        lastUpdate = current;
  
        const acceleration = event.accelerationIncludingGravity;
  
        if (!lastX) {
          lastX = acceleration.x;
          lastY = acceleration.y;
          lastZ = acceleration.z;
          return;
        }
  
        const deltaX = Math.abs(lastX - acceleration.x);
        const deltaY = Math.abs(lastY - acceleration.y);
        const deltaZ = Math.abs(lastZ - acceleration.z);
  
        if ((deltaX + deltaY + deltaZ) > SHAKE_THRESHOLD) {
          // Add visual feedback
          const display = document.querySelector('.display');
          display.classList.add('shake-feedback');
          
          // Add audio feedback
          playGlitchSound(); // Reuse existing glitch sound
          
          // Remove animation class after it completes
          setTimeout(() => {
            display.classList.remove('shake-feedback');
          }, 300);
          
          // Delay win trigger slightly
          setTimeout(() => {
            // Trigger debug win if not spinning
            if (!isSpinning) {
              document.getElementById('debugWin').click();
            }
          }, 400);
        }
  
        lastX = acceleration.x;
        lastY = acceleration.y;
        lastZ = acceleration.z;
      }
    });
  }