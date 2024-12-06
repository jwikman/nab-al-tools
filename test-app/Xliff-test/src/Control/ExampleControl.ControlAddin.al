/// <summary>
/// Control of maximum size
/// </summary>
controladdin "NAB Example Control"
{
    StartupScript = 'addin/ExampleStartup.js';
    Scripts = 'addin/ExampleScripts.js';
    HorizontalStretch = true;
    HorizontalShrink = false;
    VerticalStretch = true;
    VerticalShrink = false;

    /// <summary>
    /// On control ready
    /// </summary>
    event OnControlReady();

    /// <summary>
    /// On timer tick
    /// </summary>
    event OnTimerTick();

    /// <summary>
    /// Java execution has failed
    /// </summary>
    /// <param name="Info">The error message</param>
    event OnJavaFailed(Info: Text);

    /// <summary>
    /// Render the raw html
    /// </summary>
    /// <param name="raw">Text</param>
    procedure Render(raw: Text);

    /// <summary>
    /// Start the Timer
    /// </summary>
    /// <param name="ms">Integer = milliseconds</param>
    procedure StartTimer(ms: Integer);

    /// <summary>
    /// Stop the Timer
    /// </summary>
    procedure StopTimer();

    /// <summary>
    /// Execute the specified Java
    /// </summary>
    /// <param name="String">The java commands</param>
    procedure DoJava(String: Text);
}