export default function Logo({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="32 32 448 448" fill="none" className={className} role="img" aria-label="SmartRoute logo">
      <path d="M256 36C154.38 36 72 118.38 72 220C72 329.5 215.8 446.2 246.4 469.8C252.1 474.2 259.9 474.2 265.6 469.8C296.2 446.2 440 329.5 440 220C440 118.38 357.62 36 256 36Z" fill="#0F5C4C" />
      <circle cx="256" cy="216" r="132" fill="#FFFFFF" />
      <path d="M148 186C166 132 218 102 276 108C316 112 349 134 366 166C332 145 289 138 248 147C207 156 173 179 154 209C147 202 145 194 148 186Z" fill="#2E8B6E" />
      <path d="M256 164L265 186H247L256 164Z" fill="#D99B26" />
      <path d="M238 192H274L281 210H231L238 192Z" fill="#D99B26" />
      <path d="M218 216H294L303 236H209L218 216Z" fill="#D99B26" />
      <path d="M174 286C196 258 226 252 256 262C286 272 316 266 338 238" stroke="#0F5C4C" strokeWidth="20" strokeLinecap="round" />
      <circle cx="174" cy="286" r="13" fill="#D99B26" />
      <circle cx="338" cy="238" r="13" fill="#2E8B6E" />
    </svg>
  )
}
