using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace InsightIPOAnalyzer.Helpers;

/// <summary>
/// bool → Visibility 変換。
/// </summary>
public class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool b)
            return b ? Visibility.Visible : Visibility.Collapsed;
        return Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return value is Visibility v && v == Visibility.Visible;
    }
}

/// <summary>
/// null → Visibility 変換（null なら Collapsed）。
/// </summary>
public class NullToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var invert = parameter as string == "invert";
        var isNull = value is null;
        if (invert) isNull = !isNull;
        return isNull ? Visibility.Collapsed : Visibility.Visible;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}

/// <summary>
/// 文字列が空なら Collapsed。
/// </summary>
public class StringToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return string.IsNullOrWhiteSpace(value as string) ? Visibility.Collapsed : Visibility.Visible;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}

/// <summary>
/// ChildNodeId が null でなければ「▶」を表示するコンバーター。
/// サブ分析の存在を示す。
/// </summary>
public class HasSubAnalysisConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return value is not null ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}

/// <summary>
/// IPOセクションタイプに応じたヘッダーブラシを返すコンバーター。
/// </summary>
public class SectionTypeToBrushConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var section = value as string ?? parameter as string ?? "";
        return section.ToLowerInvariant() switch
        {
            "input" => new SolidColorBrush(Color.FromRgb(0x38, 0x8E, 0x3C)),
            "process" => new SolidColorBrush(Color.FromRgb(0xF9, 0xA8, 0x25)),
            "output" => new SolidColorBrush(Color.FromRgb(0x19, 0x76, 0xD2)),
            _ => new SolidColorBrush(Color.FromRgb(0xA8, 0xA2, 0x9E)),
        };
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
