import ChassisTokensDemoChassis
import ChassisTokensDemoSinefil
import UIKit

/// Both libraries declare the same types, so a file that imports two names the library.
public enum TwoBrands {
    public static let chassis: UIColor =
        ChassisTokensDemoChassis.ChassisTokensColor.ColorContextDefaultBgActive
    public static let sinefil: UIColor =
        ChassisTokensDemoSinefil.ChassisTokensColor.ColorContextDefaultBgActive
}
