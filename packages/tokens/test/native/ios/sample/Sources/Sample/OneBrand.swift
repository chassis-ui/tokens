import ChassisTokensDemoChassis
import UIKit

/// Tokens of one library, as an app with one brand reads them.
public enum OneBrand {
    public static let background: UIColor = ChassisTokensColor.ColorContextDefaultBgMain
    public static let text: UIColor = ChassisTokensColorLight.ColorContextDefaultFgMain
    public static let spacing: CGFloat = ChassisTokens.SpaceContextMedium
    public static let iconSize: CGFloat = ChassisTokensNumberSmall.SizeWebsiteSectionIcon
    public static let weight: UIFont.Weight = ChassisTokensString.FontContextLeadFontWeight
    public static let family: String = ChassisTokensString.FontContextLeadFontFamily

    /// The icons are in the resource bundle of the library, which is named after the
    /// package and the library
    public static func icon(named name: String) -> UIImage? {
        let bundle = Bundle.main
            .url(forResource: "ChassisTokens_ChassisTokensDemoChassis", withExtension: "bundle")
            .flatMap(Bundle.init(url:))
        return UIImage(named: name, in: bundle, compatibleWith: nil)
    }
}
