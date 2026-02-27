'use client'

import { useEffect, useRef } from 'react'

interface Star {
    x: number
    y: number
    z: number
    prevX: number
    prevY: number
    color: string
}

export default function SpaceBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const starsRef = useRef<Star[]>([])
    const animationRef = useRef<number>(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        // Star colors for variety
        const starColors = [
            '#ffffff',
            '#e0e7ff', // indigo-100
            '#c7d2fe', // indigo-200
            '#a5b4fc', // indigo-300
            '#e9d5ff', // purple-200
            '#f0abfc', // fuchsia-300
            '#93c5fd', // blue-300
        ]

        // Initialize stars with 3D positions
        const numStars = 400
        const maxDepth = 1500

        starsRef.current = Array.from({ length: numStars }, () => {
            const x = Math.random() * canvas.width - canvas.width / 2
            const y = Math.random() * canvas.height - canvas.height / 2
            const z = Math.random() * maxDepth
            return {
                x,
                y,
                z,
                prevX: x,
                prevY: y,
                color: starColors[Math.floor(Math.random() * starColors.length)],
            }
        })

        // Animation parameters
        const speed = 2
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        const animate = () => {
            // Clear with slight trail effect
            ctx.fillStyle = 'rgba(5, 5, 16, 0.15)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            starsRef.current.forEach((star) => {
                // Save previous position for trail
                star.prevX = (star.x / star.z) * 300
                star.prevY = (star.y / star.z) * 300

                // Move star towards camera
                star.z -= speed

                // Reset star if it passes the camera
                if (star.z <= 1) {
                    star.x = Math.random() * canvas.width - canvas.width / 2
                    star.y = Math.random() * canvas.height - canvas.height / 2
                    star.z = maxDepth
                    star.prevX = (star.x / star.z) * 300
                    star.prevY = (star.y / star.z) * 300
                }

                // Project 3D to 2D
                const screenX = (star.x / star.z) * 300 + centerX
                const screenY = (star.y / star.z) * 300 + centerY
                const prevScreenX = star.prevX + centerX
                const prevScreenY = star.prevY + centerY

                // Calculate size based on depth
                const size = (1 - star.z / maxDepth) * 3
                const opacity = (1 - star.z / maxDepth)

                // Draw star trail
                ctx.beginPath()
                ctx.strokeStyle = star.color
                ctx.globalAlpha = opacity * 0.5
                ctx.lineWidth = size * 0.5
                ctx.moveTo(prevScreenX, prevScreenY)
                ctx.lineTo(screenX, screenY)
                ctx.stroke()

                // Draw star
                ctx.beginPath()
                ctx.fillStyle = star.color
                ctx.globalAlpha = opacity
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2)
                ctx.fill()

                // Add glow for close stars
                if (star.z < 500) {
                    ctx.beginPath()
                    ctx.fillStyle = star.color
                    ctx.globalAlpha = opacity * 0.3
                    ctx.arc(screenX, screenY, size * 2, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            ctx.globalAlpha = 1
            animationRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animationRef.current)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom right, #050510, #0a0a20, #0f0520)' }}
        />
    )
}
