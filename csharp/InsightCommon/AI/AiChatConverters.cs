using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace InsightCommon.AI;

/// <summary>
/// モデルインデックス(0=Haiku, 1=Sonnet, 2=Opus) → 表示名変換
/// </summary>
public class ModelIndexToNameConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is int index)
            return ClaudeModels.GetDisplayName(index);
        return "";
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}

/// <summary>
/// モデルインデックス → ペルソナ表示名変換 (例: "Claude恵 (Sonnet ⭐)")
/// </summary>
public class ModelIndexToPersonaNameConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is int index)
            return ClaudeModels.GetPersonaDisplayName(index);
        return "";
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}

/// <summary>
/// AiMessageRole → HorizontalAlignment（User=右, Assistant=左）
/// </summary>
public class RoleToAlignmentConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is AiMessageRole role)
            return role == AiMessageRole.User ? HorizontalAlignment.Right : HorizontalAlignment.Left;
        return HorizontalAlignment.Left;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}

/// <summary>
/// AiMessageRole → 背景色ブラシ（User=ベージュ, Assistant=白）
/// </summary>
public class RoleToBrushConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is AiMessageRole role)
        {
            return role switch
            {
                AiMessageRole.User => new SolidColorBrush(Color.FromRgb(0xF5, 0xF0, 0xE8)),
                AiMessageRole.Assistant => new SolidColorBrush(Colors.White),
                _ => new SolidColorBrush(Colors.Transparent)
            };
        }
        return new SolidColorBrush(Colors.White);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
