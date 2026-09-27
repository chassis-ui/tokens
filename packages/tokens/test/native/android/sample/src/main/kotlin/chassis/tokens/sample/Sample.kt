package chassis.tokens.sample

import android.content.Context
import android.graphics.drawable.Drawable
import chassis.tokens.R

/** Tokens of the library in Kotlin, by the R class of the library. */
class Sample(context: Context) {
  val background: Int = context.getColor(R.color.color_context_default_bg_main)
  val padding: Int = context.resources.getDimensionPixelSize(R.dimen.space_context_medium)
  val weight: Int = context.resources.getInteger(R.integer.font_context_lead_font_weight)
  val family: String = context.getString(R.string.typography_font_family_text)
  val icon: Drawable? = context.getDrawable(R.drawable.icon_chip_remove)
}
