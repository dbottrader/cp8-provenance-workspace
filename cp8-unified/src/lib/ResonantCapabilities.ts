/**
 * ResonantCapabilities - GPU Detection and Fallback Layer
 * 
 * Production-grade capability detection for WebGPU with WebGL2 fallback.
 * Handles vendor-specific quirks and driver instability as of February 2026.
 * 
 * @author Unified Resonant Systems
 * @version 1.0.0
 */

export interface GPUCapabilities {
  webgpuSupported: boolean;
  webgl2Supported: boolean;
  computeShadersSupported: boolean;
  storageBuffersSupported: boolean;
  maxWorkgroupSize: number;
  maxStorageBufferBindingSize: number;
  uniformBufferAlignment: number;
  vendor: string;
  renderer: string;
  driverIssues: string[];
}

export interface DetectionResult {
  primaryRenderer: 'webgpu' | 'webgl2' | 'cpu';
  capabilities: GPUCapabilities;
  warnings: string[];
  fallbackRequired: boolean;
}

/**
 * Known problematic driver configurations (as of February 2026)
 */
const KNOWN_ISSUES = {
  nvidia: {
    pattern: /NVIDIA.*572\./,
    issue: 'NVIDIA 572.xx drivers may crash RTX 30/40 series cards'
  },
  amd: {
    pattern: /AMD.*Radeon HD 7700/,
    issue: 'AMD Radeon HD 7700 series produces rendering artifacts'
  },
  intel: {
    pattern: /Intel.*(UHD|HD Graphics [45][0-9]{3})/,
    issue: 'Intel integrated graphics may experience driver hangs'
  }
};

/**
 * Comprehensive GPU capability detection
 */
export async function detectCapabilities(): Promise<DetectionResult> {
  const warnings: string[] = [];
  const driverIssues: string[] = [];
  
  // Get GPU info if available
  let vendor = 'unknown';
  let renderer = 'unknown';
  
  const gl = document.createElement('canvas').getContext('webgl2');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
    }
  }

  // Check for known driver issues
  Object.entries(KNOWN_ISSUES).forEach(([, { pattern, issue }]) => {
    if (pattern.test(renderer)) {
      driverIssues.push(issue);
      warnings.push(`Driver issue detected: ${issue}`);
    }
  });

  // WebGPU Detection
  let webgpuSupported = false;
  let computeShadersSupported = false;
  let storageBuffersSupported = false;
  let maxWorkgroupSize = 0;
  let maxStorageBufferBindingSize = 0;
  let uniformBufferAlignment = 256;

  const nav = navigator as Navigator & { gpu?: { requestAdapter: (opts?: object) => Promise<{ requestDevice: () => Promise<{ limits: Record<string, number>; createShaderModule: (o: object) => void; destroy: () => void }> } | null> } }
  if (nav.gpu) {
    try {
      const adapter = await nav.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });
      
      if (adapter) {
        const device = await adapter.requestDevice();
        
        webgpuSupported = true;
        computeShadersSupported = true;
        
        // Check limits
        const limits = device.limits;
        maxWorkgroupSize = limits.maxComputeWorkgroupSizeX || 256;
        maxStorageBufferBindingSize = limits.maxStorageBufferBindingSize || 134217728;
        uniformBufferAlignment = limits.minUniformBufferOffsetAlignment || 256;
        
        // Test storage buffer support in vertex shaders
        // 45% of older devices lack this capability
        try {
          const testShader = `
            @group(0) @binding(0)
            var<storage, read> testBuffer: array<f32>;
            
            @vertex
            fn main(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4<f32> {
              return vec4<f32>(testBuffer[idx], 0.0, 0.0, 1.0);
            }
          `;
          
          device.createShaderModule({ code: testShader });
          storageBuffersSupported = true;
        } catch (e) {
          storageBuffersSupported = false;
          warnings.push('Storage buffers in vertex shaders not supported - using compatibility mode');
        }
        
        device.destroy();
      }
    } catch (error) {
      webgpuSupported = false;
      warnings.push(`WebGPU detection failed: ${error}`);
    }
  } else {
    warnings.push('WebGPU not available in this browser');
  }

  // WebGL2 Detection
  const webgl2Supported = gl !== null;
  
  if (!webgl2Supported) {
    warnings.push('WebGL2 not supported - falling back to CPU rendering');
  }

  // Determine primary renderer
  let primaryRenderer: 'webgpu' | 'webgl2' | 'cpu' = 'cpu';
  let fallbackRequired = false;
  
  if (webgpuSupported && storageBuffersSupported && driverIssues.length === 0) {
    primaryRenderer = 'webgpu';
  } else if (webgl2Supported) {
    primaryRenderer = 'webgl2';
    fallbackRequired = webgpuSupported && !storageBuffersSupported;
    if (fallbackRequired) {
      warnings.push('Using WebGL2 fallback due to WebGPU limitations');
    }
  } else {
    primaryRenderer = 'cpu';
    fallbackRequired = true;
  }

  return {
    primaryRenderer,
    capabilities: {
      webgpuSupported,
      webgl2Supported,
      computeShadersSupported,
      storageBuffersSupported,
      maxWorkgroupSize,
      maxStorageBufferBindingSize,
      uniformBufferAlignment,
      vendor,
      renderer,
      driverIssues
    },
    warnings,
    fallbackRequired
  };
}

/**
 * Get recommended workgroup size for compute shaders
 */
export function getWorkgroupSize(capabilities: GPUCapabilities): number {
  // Conservative default for broad compatibility
  const DEFAULT_SIZE = 64;
  
  if (capabilities.maxWorkgroupSize >= 256) {
    return 256; // Optimal for modern GPUs
  } else if (capabilities.maxWorkgroupSize >= 128) {
    return 128;
  } else {
    return Math.min(DEFAULT_SIZE, capabilities.maxWorkgroupSize);
  }
}

/**
 * Check if compute-based deformation is viable
 */
export function canUseComputeDeformation(result: DetectionResult): boolean {
  return result.primaryRenderer === 'webgpu' && 
         result.capabilities.computeShadersSupported &&
         result.capabilities.storageBuffersSupported;
}

/**
 * Log capability report for debugging
 */
export function logCapabilities(result: DetectionResult): void {
  console.group('🔮 ResonantCapabilities Report');
  console.log('Primary Renderer:', result.primaryRenderer);
  console.log('WebGPU:', result.capabilities.webgpuSupported ? '✓' : '✗');
  console.log('Compute Shaders:', result.capabilities.computeShadersSupported ? '✓' : '✗');
  console.log('Storage Buffers:', result.capabilities.storageBuffersSupported ? '✓' : '✗');
  console.log('Max Workgroup Size:', result.capabilities.maxWorkgroupSize);
  console.log('GPU Vendor:', result.capabilities.vendor);
  console.log('GPU Renderer:', result.capabilities.renderer);
  
  if (result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings);
  }
  
  console.groupEnd();
}

export default detectCapabilities;
