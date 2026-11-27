// g++ -O3 -std=c++17 -fopenmp scripts/adaptation-study.cpp -o output/study.exe
// study.exe <runs per cell> [first seed index] > results.csv
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <omp.h>
#include <sstream>
#include <string>

using namespace std;
constexpr double skill[8][5] = {
    {.75, .50, .30, .20, .10}, {.85, .65, .45, .30, .20},
    {.92, .80, .60, .40, .25}, {.95, .90, .80, .60, .40},
    {.98, .96, .90, .80, .60}, {.99, .98, .95, .85, .70},
    {.98, .95, .55, .35, .20}, {.95, .90, .60, .75, .50}};

uint64_t draw(uint64_t &seed) {
  uint64_t x = (seed += 0x9e3779b97f4a7c15ULL);
  x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
  x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
  return x ^ (x >> 31);
}
struct Draw {
  double answer, outcome, cluster;
  int op;
  bool review, weak, refresh;
};
double uniform(uint32_t n) { return n * 0x1p-32; }
Draw sample(uint64_t &seed) {
  auto a = draw(seed), b = draw(seed), c = draw(seed);
  return {uniform(a >> 32), uniform(a),  uniform(b >> 32), int(c & 3),
          uniform(b) < .2,  bool(c & 4), bool(c & 8)};
}

struct Block {
  int clean = 0, skipped = 0, edits = 0, corrected = 0;
};
struct State {
  int level = 1, trend = 0, phase = 0, attempts = 0, exposure = 0,
      learnedAt = -1;
  int promotedAt = 0, target = 0, postN = 0, postClean = 0;
  bool fell = false, learningSuccess = false;
  double cluster = -1;
  bool checking = false;
  int cleanRun = 0, checkedCount = 0, checkedErrors = 0;
  Block block;
};
// phase 0 = ordinary adaptation, 1 = opening, 2 = perfect confirmation.
void finish(State &s) {
  const auto b = s.block;
  int direction = b.skipped >= 3 || b.corrected >= 5 || b.edits >= 8
                      ? -1
                      : (b.clean >= 7 && !b.skipped ? 1 : 0);
  int trend = direction && direction == s.trend ? direction * 2 : direction;
  bool promote = direction == 1 && (s.phase == 1 || trend == 2) &&
                 (!s.phase || b.clean == 8);
  int delta = promote ? 1 : (trend == -2 ? -1 : 0);
  s.level = clamp(s.level + delta, 1, 5);
  if (s.level != 1)
    s.phase = 0;
  s.trend = delta ? 0 : direction;
  s.block = {};
}

void updateLevel(State &s, int rule, int material, bool clean, bool skip,
                 int edits) {
  s.block.clean += clean;
  s.block.skipped += skip;
  s.block.edits += edits;
  s.block.corrected += edits > 0;
  const int old = s.level;
  const bool firstPromotion = s.phase != 0;
  if (!clean && s.phase == 1)
    s.phase = 2;
  if (s.block.clean + s.block.skipped + s.block.corrected == 8)
    finish(s);
  if (rule == 2 && material == old && (old == 2 || old == 3)) {
    s.cleanRun = clean ? s.cleanRun + 1 : 0;
    if (s.checking) {
      s.checkedErrors += !clean;
      s.checkedCount++;
      if (s.checkedErrors >= 3)
        s.level = 1;
      if (s.checkedCount == 6)
        s.checking = false;
    }
    if (s.cleanRun == (old == 2 ? 6 : 9))
      s.level = old + 1;
  }
  if (s.level != old) {
    s.trend = 0;
    s.block = {};
    s.phase = 0;
    s.cleanRun = s.checkedCount = s.checkedErrors = 0;
    s.checking = rule == 2 && old == 1 && s.level == 2 && firstPromotion;
  }
}

struct Totals {
  long long newMaterial = 0, newMaterialErrors = 0, level4by32 = 0;
  long long hit8 = 0, hit16 = 0, hit24 = 0, hit3 = 0, hit4 = 0, noUp = 0,
            down24 = 0;
  long long window = 0, learn = 0, post = 0, bad = 0, correct = 0,
            fallWindow = 0, fall = 0;
  long long sumLevel[4][3] = {}, late[5] = {}, delay[241] = {}, pairMissing = 0;
  void print(int p, int style, int rule, int sc, int n) const {
    cout << p << ',' << style << ',' << rule << ',' << sc << ',' << n;
    for (auto v : {hit8, hit16, hit24, hit3, hit4, noUp, down24, window, learn,
                   post, bad, correct, fallWindow, fall, pairMissing,
                   newMaterial, newMaterialErrors, level4by32})
      cout << ',' << v;
    for (auto &op : sumLevel)
      for (auto v : op)
        cout << ',' << v;
    for (auto v : late)
      cout << ',' << v;
    long long count = 0;
    for (auto v : delay)
      count += v;
    for (double q : {.5, .9}) {
      long long cumulative = 0;
      int value = -999;
      for (int k = 0; count && k <= 240; k++)
        if ((cumulative += delay[k]) >= ceil(q * count)) {
          value = k - 120;
          break;
        }
      cout << ',' << value;
    }
    cout << '\n';
  }
};

int train(const Draw *draws, int p, int style, int rule, int sc, Totals &totals,
          int control) {
  const bool mixed = sc == 5 || sc == 6;
  const int duration = mixed ? 480 : 120, start = sc < 5 ? sc + 1 : 1;
  const int forced[] = {0, 1, 4, 8, 9};
  const int mistake = sc >= 7 ? forced[sc - 7] : -1;
  State states[4];
  int earliest = 0;
  bool reached4by32 = false;
  bool flagsDown = false, flags3 = false, flags4 = false;
  for (auto &s : states) {
    s.level = start;
    s.phase = rule && start == 1 ? 1 : 0;
  }
  for (int t = 1; t <= duration; t++) {
    const Draw &d = draws[t - 1];
    int op = mixed ? d.op : 0;
    State &s = states[op];
    int profile = sc == 6 && op >= 2 ? (op == 2 ? 5 : 0) : p;
    int material = s.level - (s.level > 1 && d.review);
    double prob = profile == 7 && material == 3 && s.exposure >= 30
                      ? .90
                      : skill[profile][material - 1];
    double answer = d.answer;
    if (style == 4) {
      if (s.cluster < 0 || d.refresh)
        s.cluster = d.cluster;
      answer = s.cluster;
    }
    if (style == 5) {
      double gap = min({.2, prob, 1 - prob});
      prob += d.weak ? -gap : gap;
    }
    bool clean = answer < prob;
    if (sc >= 7 && t <= 9)
      clean = t != mistake;
    bool skip = !clean && d.outcome >= (style == 0 ? .8 : style == 1 ? .2 : .5);
    int edits = !clean && !skip ? (style == 3 && d.outcome < .25 ? 3 : 1) : 0;
    if (mistake > 0 && t == mistake) {
      skip = false;
      edits = 1;
    }
    s.attempts++;
    if (s.promotedAt && s.attempts <= s.promotedAt + 24 &&
        material == s.target && !s.fell) {
      totals.newMaterial++;
      totals.newMaterialErrors += !clean;
    }
    if (t > 60)
      totals.late[s.level - 1]++;
    if (s.target && material == s.target && s.postN < 10) {
      s.postN++;
      s.postClean += clean;
    }
    if (profile == 7 && material == 3 && ++s.exposure == 30)
      s.learnedAt = s.attempts;
    const int old = s.level;
    updateLevel(s, rule, material, clean, skip, edits);
    if (s.level != old) {
      if (s.level > old && !s.promotedAt) {
        s.target = s.level;
        s.promotedAt = s.attempts;
        if (!earliest)
          earliest = t;
      }
    }
    if (s.target && s.attempts <= s.promotedAt + 24 && s.level < s.target)
      s.fell = true;
    if (s.learnedAt >= 0 && s.attempts > s.learnedAt &&
        s.attempts <= s.learnedAt + 24 && s.level >= 4)
      s.learningSuccess = true;
    if (t == 20 || t == 40 || t == 60)
      for (int j = 0; j < (mixed ? 4 : 1); j++)
        totals.sumLevel[j][t / 20 - 1] += states[j].level;
    if (!mixed && t <= 32 && s.level >= 4)
      reached4by32 = true;
    if (!mixed && t <= 24 && s.level < start)
      flagsDown = true;
    if (!mixed && start == 1 && t <= 24 && s.level >= 3)
      flags3 = true;
    if (!mixed && start == 1 && t <= 48 && s.level >= 4)
      flags4 = true;
  }
  totals.level4by32 += reached4by32;
  totals.down24 += flagsDown;
  totals.hit3 += flags3;
  totals.hit4 += flags4;
  totals.noUp += !earliest;
  totals.hit8 += earliest && earliest <= 8;
  totals.hit16 += earliest && earliest <= 16;
  totals.hit24 += earliest && earliest <= 24;
  for (int j = 0; j < (mixed ? 4 : 1); j++) {
    const auto &s = states[j];
    if (s.postN == 10) {
      totals.post++;
      totals.correct += s.postClean;
      totals.bad += s.postClean < 5;
    }
    if (s.promotedAt && s.attempts >= s.promotedAt + 24) {
      totals.fallWindow++;
      totals.fall += s.fell;
    }
    if (s.learnedAt >= 0 && s.attempts >= s.learnedAt + 24) {
      totals.window++;
      totals.learn += s.learningSuccess;
    }
  }
  if (sc >= 8) {
    if (control && earliest)
      totals.delay[120 + earliest - control]++;
    else
      totals.pairMissing++;
  }
  return earliest;
}
int main(int argc, char **argv) {
  if (argc == 2 && string(argv[1]) == "audit") {
    int level, trend, phase, clean, skips, edits, corrected;
    while (cin >> level >> trend >> phase >> clean >> skips >> edits >>
           corrected) {
      State s;
      s.level = level;
      s.trend = trend;
      s.phase = phase;
      s.block = {clean, skips, edits, corrected};
      finish(s);
      cout << s.level << ' ' << s.trend << ' ' << s.phase << '\n';
    }
    return 0;
  }
  if (argc == 2 && string(argv[1]) == "trace") {
    State state;
    int start, material, skipped, edits;
    while (cin >> start >> material >> skipped >> edits) {
      if (start) {
        state = {};
        state.level = start;
        state.phase = start == 1 ? 1 : 0;
      }
      updateLevel(state, 2, material, !skipped && !edits, skipped, edits);
      cout << state.level << ' ' << state.trend << ' ' << state.checking << ' '
           << state.block.clean + state.block.corrected + state.block.skipped
           << '\n';
    }
    return 0;
  }
  int runs = argc > 1 ? atoi(argv[1]) : 1000,
      offset = argc > 2 ? atoi(argv[2]) : 0;
  cout << "profile,style,rule,scenario,runs,up8,up16,up24,level3by24,"
          "level4by48,noUp,down24,learningWindows,learned,postWindows,badPost,"
          "postCorrect,fallWindows,fell,missingDelay,newMaterial,"
          "newMaterialErrors,level4by32";
  for (int op = 0; op < 4; op++)
    for (int t : {20, 40, 60})
      cout << ",op" << op << "at" << t;
  for (int l = 1; l <= 5; l++)
    cout << ",late" << l;
  cout << ",medianDelay,p90Delay\n";
#pragma omp parallel for schedule(dynamic) num_threads(12)
  for (int cell = 0; cell < 48; cell++) {
    Totals stats[3][12];
    int p = cell / 6, style = cell % 6;
    for (int i = 0; i < runs; i++) {
      uint64_t seed = (uint64_t(i + offset) << 16) + cell + 4711;
      Draw draws[480];
      for (auto &d : draws)
        d = sample(seed);
      for (int rule = 0; rule < 3; rule++) {
        int control = 0;
        for (int sc = 0; sc < 12; sc++) {
          int first =
              train(draws, p, style, rule, sc, stats[rule][sc], control);
          if (sc == 7)
            control = first;
        }
      }
    }
#pragma omp critical
    {
      for (int rule = 0; rule < 3; rule++)
        for (int sc = 0; sc < 12; sc++)
          stats[rule][sc].print(p, style, rule, sc, runs);
    }
  }
}
