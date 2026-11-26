import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
BRANCH = "main"
SERVER = Path(__file__).resolve().with_name("alfun2.py")


def git(*args, check=True):
    return subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=check
    )


def gagal(pesan):
    print(f"\n[ERROR] {pesan}")
    input("Tekan Enter untuk keluar...")
    raise SystemExit(1)


def sinkronisasi():
    print("=== SINKRONISASI ALFUN3 ===")

    try:
        branch = git("branch", "--show-current").stdout.strip()
        if branch != BRANCH:
            gagal(f"Branch aktif '{branch}', seharusnya '{BRANCH}'.")

        print("[1/3] Memeriksa GitHub...")
        git("fetch", "origin", BRANCH)

        status = git("status", "--porcelain").stdout.strip()
        ahead_behind = git(
            "rev-list", "--left-right", "--count",
            f"HEAD...origin/{BRANCH}"
        ).stdout.strip()

        ahead, behind = map(int, ahead_behind.split())

        if status:
            print("\n[PERINGATAN] Ada perubahan lokal yang belum di-commit:")
            print(status)
            print("Perubahan tersebut tidak akan diubah atau dikirim otomatis.")

        if ahead == 0 and behind == 0:
            print("[OK] Commit lokal dan GitHub sudah sinkron.")

        elif ahead > 0 and behind == 0:
            print(f"[2/3] Mengirim {ahead} commit lokal ke GitHub...")
            git("push", "origin", BRANCH)
            print("[OK] Push selesai.")

        elif ahead == 0 and behind > 0:
            if status:
                gagal("GitHub memiliki commit baru, tetapi ada perubahan lokal. "
                      "Simpan/commit perubahan atau gunakan pull manual.")
            print(f"[2/3] Mengambil {behind} commit dari GitHub...")
            git("pull", "--ff-only", "origin", BRANCH)
            print("[OK] Pull selesai.")

        else:
            gagal(f"Riwayat divergen: lokal {ahead} commit di depan dan "
                  f"GitHub {behind} commit di depan. Selesaikan secara manual.")

        if status:
            print("[INFO] Working tree masih memiliki perubahan yang belum di-commit.")
        print("[OK] Pemeriksaan sinkronisasi selesai.")

    except FileNotFoundError:
        gagal("Git tidak ditemukan. Pastikan Git sudah terpasang dan masuk PATH.")
    except subprocess.CalledProcessError as error:
        detail = error.stderr.strip() or error.stdout.strip() or str(error)
        gagal(f"Perintah Git gagal.\n{detail}")


if __name__ == "__main__":
    if not SERVER.is_file():
        gagal(f"File server tidak ditemukan: {SERVER}")

    sinkronisasi()
    print("\n=== MENJALANKAN SERVER ===")
    subprocess.run([sys.executable, str(SERVER)], cwd=ROOT)
