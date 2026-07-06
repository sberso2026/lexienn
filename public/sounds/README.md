# Launch sound assets

Place short MP3 clips here for the Iron Man-style assembly sequence:

| File | Used when |
| --- | --- |
| `lexienn-metal-1.mp3` | Blue swoosh locks in |
| `lexienn-metal-2.mp3` | Red swoosh locks in |
| `lexienn-metal-3.mp3` | Book / page lock-in |
| `lexienn-final-burst.mp3` | Logo assembly completes |

If files are missing, `lib/audio/launchSounds.ts` falls back to synthesized Web Audio clicks so the app never breaks.

Recommended: keep clips under 400ms, normalized, and at moderate volume. Sounds only play after the user taps **Enter Lexienn** on the launch screen.
