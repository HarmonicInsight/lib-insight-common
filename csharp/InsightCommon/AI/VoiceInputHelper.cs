using System;
using System.Runtime.InteropServices;

namespace InsightCommon.AI;

/// <summary>
/// Win+H キーストロークで Windows 音声入力を起動するヘルパー
/// 全Insight Business Suite系アプリで共通利用
/// </summary>
public static class VoiceInputHelper
{
    /// <summary>
    /// Windows の音声入力 (Win+H) を起動する。
    /// 呼び出し前にテキスト入力先のコントロールにフォーカスを当てること。
    /// </summary>
    public static void ActivateWindowsVoiceTyping()
    {
        var inputs = new NativeMethods.INPUT[4];

        // Win key down
        inputs[0] = CreateKeyInput(NativeMethods.VK_LWIN, false);
        // H key down
        inputs[1] = CreateKeyInput(NativeMethods.VK_H, false);
        // H key up
        inputs[2] = CreateKeyInput(NativeMethods.VK_H, true);
        // Win key up
        inputs[3] = CreateKeyInput(NativeMethods.VK_LWIN, true);

        _ = NativeMethods.SendInput((uint)inputs.Length, inputs, Marshal.SizeOf<NativeMethods.INPUT>());
    }

    private static NativeMethods.INPUT CreateKeyInput(ushort vk, bool keyUp)
    {
        var input = new NativeMethods.INPUT { type = NativeMethods.INPUT_KEYBOARD };
        input.u.ki.wVk = vk;
        input.u.ki.dwFlags = keyUp ? NativeMethods.KEYEVENTF_KEYUP : 0u;
        return input;
    }

    private static class NativeMethods
    {
        public const uint INPUT_KEYBOARD = 1;
        public const uint KEYEVENTF_KEYUP = 0x0002;
        public const ushort VK_LWIN = 0x5B;
        public const ushort VK_H = 0x48;

        [StructLayout(LayoutKind.Sequential)]
        public struct INPUT
        {
            public uint type;
            public InputUnion u;
        }

        [StructLayout(LayoutKind.Explicit)]
        public struct InputUnion
        {
            [FieldOffset(0)] public KEYBDINPUT ki;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
    }
}
