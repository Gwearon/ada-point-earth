window.Tappable = (element, pxLimit = 8, timeoutMs = 300) => {
    let x = null
    let y = null
    let isTimeout = false
    let timer = null
    let originalEvent = null
    let draggingDispatched = false
    let isDragging = false

    const isOverDistance = (e) => {
        const diffX = e.pageX - x;
        const diffY = e.pageY - y;
        return Math.abs(diffX) > pxLimit || Math.abs(diffY) > pxLimit
    }

    const start = (e) => {
        x = e.pageX
        y = e.pageY
        originalEvent = e
        draggingDispatched = false
        isDragging = true

        isTimeout = false
        timer = setTimeout(() => {
            isTimeout = true
        }, timeoutMs)

        element.dispatchEvent(new CustomEvent('tapStart'));
    }

    const move = (e) => {
        if (isDragging && (isTimeout || isOverDistance(e)) && !draggingDispatched) {
            draggingDispatched = true
            element.dispatchEvent(new CustomEvent('dragging'))
        }
    }

    const end = (e) => {
        clearTimeout(timer)
        isDragging = false
        if (isTimeout || isOverDistance(e)) {
            return
        }

        const isMouseEvent = event instanceof MouseEvent
        element.dispatchEvent(new CustomEvent('tap', { detail: {
            clientX: isMouseEvent ? originalEvent.clientX : originalEvent.touches[0].clientX,
            clientY: isMouseEvent ? originalEvent.clientY : originalEvent.touches[0].clientY
        }}))
    }

    element.addEventListener('touchstart', start, false)
    element.addEventListener('touchmove', move, true)
    element.addEventListener('touchend', end, false)

    element.addEventListener('mousedown', start, false)
    element.addEventListener('mousemove', move, false)
    element.addEventListener('mouseup', end, false)

    return {
        destroy: () => {
            element.removeEventListener('touchstart')
            element.removeEventListener('touchmove')
            element.removeEventListener('touchend')

            element.removeEventListener('mousedown')
            element.removeEventListener('mousemove')
            element.removeEventListener('mouseup')
        }
    }
}