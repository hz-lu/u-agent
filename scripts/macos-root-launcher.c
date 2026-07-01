#include <errno.h>
#include <limits.h>
#include <mach-o/dyld.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static int parent_dir(char *path) {
  char *slash = strrchr(path, '/');
  if (!slash || slash == path) return -1;
  *slash = '\0';
  return 0;
}

int main(void) {
  char exe_path[PATH_MAX];
  uint32_t exe_path_size = sizeof(exe_path);
  if (_NSGetExecutablePath(exe_path, &exe_path_size) != 0) {
    fprintf(stderr, "OpenClawPro launcher path is too long.\n");
    return 1;
  }

  char resolved_exe[PATH_MAX];
  if (!realpath(exe_path, resolved_exe)) {
    fprintf(stderr, "OpenClawPro launcher realpath failed: %s\n", strerror(errno));
    return 1;
  }

  char contents_dir[PATH_MAX];
  snprintf(contents_dir, sizeof(contents_dir), "%s", resolved_exe);
  if (parent_dir(contents_dir) != 0 || parent_dir(contents_dir) != 0) {
    fprintf(stderr, "OpenClawPro launcher bundle path is invalid.\n");
    return 1;
  }

  char script_path[PATH_MAX];
  snprintf(script_path, sizeof(script_path), "%s/Resources/launcher.sh", contents_dir);
  execl("/bin/bash", "bash", script_path, (char *)NULL);
  fprintf(stderr, "OpenClawPro launcher failed to exec bash: %s\n", strerror(errno));
  return 1;
}
