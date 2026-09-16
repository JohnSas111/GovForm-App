package expo.modules.blurdetector

import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.InputStream
import kotlin.math.pow

class ExpoBlurDetectorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlurDetector")

    AsyncFunction("getBlurScore") { uriString: String ->
      getBlurScoreImpl(uriString)
    }
  }

  private fun getBlurScoreImpl(uriString: String): Double {
      val uri = Uri.parse(uriString)
      val context = appContext.reactContext ?: return 0.0
      val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
      
      // Decode with inSampleSize to downscale and speed up processing
      val options = BitmapFactory.Options()
      options.inSampleSize = 4 // Downscale by 4x for speed
      val bitmap = BitmapFactory.decodeStream(inputStream, null, options) ?: return 0.0
      inputStream?.close()

      val width = bitmap.width
      val height = bitmap.height
      val pixels = IntArray(width * height)
      bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

      // Convert to grayscale (luminance)
      val grayPixels = DoubleArray(width * height)
      for (i in pixels.indices) {
          val p = pixels[i]
          val r = Color.red(p)
          val g = Color.green(p)
          val b = Color.blue(p)
          grayPixels[i] = (r * 0.299 + g * 0.587 + b * 0.114)
      }
      bitmap.recycle() // free memory early

      // 3x3 Laplacian filter
      // [ 0,  1,  0 ]
      // [ 1, -4,  1 ]
      // [ 0,  1,  0 ]
      val laplacian = DoubleArray(width * height)
      var sum = 0.0
      var count = 0
      
      for (y in 1 until height - 1) {
          for (x in 1 until width - 1) {
              val i = y * width + x
              val value = grayPixels[i - width] + 
                          grayPixels[i - 1] - (4.0 * grayPixels[i]) + 
                          grayPixels[i + 1] + 
                          grayPixels[i + width]
              laplacian[i] = value
              sum += value
              count++
          }
      }
      
      val mean = sum / count
      var varianceSum = 0.0
      for (y in 1 until height - 1) {
          for (x in 1 until width - 1) {
              val i = y * width + x
              val diff = laplacian[i] - mean
              varianceSum += diff * diff
          }
      }
      
      return varianceSum / count
  }
}
