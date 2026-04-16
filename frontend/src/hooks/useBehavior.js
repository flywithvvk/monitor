import { useState, useEffect, useRef } from 'react';

/**
 * Layer 3: Behavioral Tracking Hook
 * Monitors user behavior to detect bots and suspicious activity
 */
export function useBehavior() {
  const [behavior, setBehavior] = useState({});
  const pageLoadTime = useRef(Date.now());
  const keystrokeTimestamps = useRef([]);
  const mousePositions = useRef([]);
  const tabSwitchCount = useRef(0);
  const scrollDetected = useRef(false);

  useEffect(() => {
    // Mouse movement tracking
    const mouseMoveHandler = (e) => {
      const now = Date.now();
      if (mousePositions.current.length < 20) {
        mousePositions.current.push({
          x: e.clientX,
          y: e.clientY,
          timestamp: now
        });
      }
    };

    // Tab/window visibility tracking
    const visibilityHandler = () => {
      if (document.hidden) {
        tabSwitchCount.current++;
      }
    };

    // Scroll tracking
    const scrollHandler = () => {
      scrollDetected.current = true;
    };

    // Add event listeners
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('scroll', scrollHandler);

    // Sample mouse positions every 100ms for first 2 seconds
    const mouseInterval = setInterval(() => {
      if (Date.now() - pageLoadTime.current > 2000) {
        clearInterval(mouseInterval);
      }
    }, 100);

    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('scroll', scrollHandler);
      clearInterval(mouseInterval);
    };
  }, []);

  /**
   * Track keystroke dynamics on input field
   */
  const trackKeystroke = (event) => {
    keystrokeTimestamps.current.push({
      key: event.key,
      timestamp: Date.now()
    });
  };

  /**
   * Detect paste event
   */
  const trackPaste = (callback) => {
    return (event) => {
      if (callback) callback(true);
    };
  };

  /**
   * Get comprehensive behavior data
   */
  const getBehaviorData = (passwordPasted = false, autofillDetected = false) => {
    const timeOnPage = (Date.now() - pageLoadTime.current) / 1000;

    // Calculate typing dynamics
    const typingStats = calculateTypingStats(keystrokeTimestamps.current);

    // Calculate mouse movement patterns
    const mouseStats = calculateMouseStats(mousePositions.current);

    return {
      time_on_page_seconds: timeOnPage,
      typing_speed: typingStats.speed,
      typing_variance: typingStats.variance,
      password_pasted: passwordPasted,
      mouse_moved: mouseStats.moved,
      mouse_straightness: mouseStats.straightness,
      mouse_samples: mousePositions.current.length,
      tab_switch_count: tabSwitchCount.current,
      autofill_detected: autofillDetected,
      scroll_detected: scrollDetected.current,
      failed_attempts_session: 0 // To be tracked by parent component
    };
  };

  return {
    trackKeystroke,
    trackPaste,
    getBehaviorData,
    behavior
  };
}

/**
 * Calculate typing statistics
 */
function calculateTypingStats(timestamps) {
  if (timestamps.length < 2) {
    return { speed: 0, variance: 0 };
  }

  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    const interval = timestamps[i].timestamp - timestamps[i - 1].timestamp;
    intervals.push(interval);
  }

  // Calculate average typing speed (chars per second)
  const totalTime = timestamps[timestamps.length - 1].timestamp - timestamps[0].timestamp;
  const speed = totalTime > 0 ? (timestamps.length / totalTime) * 1000 : 0;

  // Calculate variance in typing intervals
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - mean, 2);
  }, 0) / intervals.length;

  return {
    speed: parseFloat(speed.toFixed(2)),
    variance: parseFloat(variance.toFixed(2))
  };
}

/**
 * Calculate mouse movement patterns
 */
function calculateMouseStats(positions) {
  if (positions.length < 2) {
    return { moved: false, straightness: 0 };
  }

  // Calculate if mouse moved at all
  const moved = positions.length > 1;

  // Calculate straightness (0 = perfectly straight, 1 = very curved)
  let totalDistance = 0;
  let straightDistance = 0;

  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i - 1].x;
    const dy = positions[i].y - positions[i - 1].y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }

  if (positions.length > 1) {
    const firstPos = positions[0];
    const lastPos = positions[positions.length - 1];
    const dx = lastPos.x - firstPos.x;
    const dy = lastPos.y - firstPos.y;
    straightDistance = Math.sqrt(dx * dx + dy * dy);
  }

  const straightness = straightDistance > 0
    ? parseFloat((straightDistance / totalDistance).toFixed(2))
    : 0;

  return {
    moved,
    straightness
  };
}

export default useBehavior;
