# -*- coding: utf-8 -*-
"""Generate scheduler system flowchart for AgriFlow AI using matplotlib."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np


def _arrow(ax, x1, y1, x2, y2, color='#2563eb', lw=1.5):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=lw))


def _box(ax, x, y, w, h, text, color='#1e293b', text_color='#ffffff', fontsize=8, bold=False):
    rect = mpatches.FancyBboxPatch((x - w / 2, y - h / 2), w, h,
                                    boxstyle="round,pad=0.1",
                                    facecolor=color, edgecolor='none', zorder=3)
    ax.add_patch(rect)
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            color=text_color, fontweight='bold' if bold else 'normal', zorder=4)


def _diamond(ax, x, y, w, h, text, color='#f59e0b', text_color='#ffffff', fontsize=7):
    pts = np.array([[x, y + h / 2], [x + w / 2, y], [x, y - h / 2], [x - w / 2, y]])
    poly = mpatches.Polygon(pts, closed=True, facecolor=color, edgecolor='none', zorder=3)
    ax.add_patch(poly)
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            color=text_color, fontweight='normal', zorder=4)


def generate(output_path):
    fig, ax = plt.subplots(1, 1, figsize=(7, 10))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 15)
    ax.axis('off')

    c_primary = '#2563eb'
    c_success = '#22c55e'
    c_warning = '#f59e0b'
    c_danger = '#ef4444'
    c_dark = '#1e293b'
    c_muted = '#64748b'
    c_white = '#ffffff'

    bw, bh = 2.6, 0.55

    start = (5, 14.2)
    order = (5, 12.7)
    confirm = (5, 11.2)
    sort = (5, 9.7)
    allocate = (5, 8.2)
    assign = (5, 6.7)
    notify = (5, 5.2)
    deliver = (5, 3.7)
    complete = (5, 2.2)

    _box(ax, start[0], start[1], bw * 0.8, bh * 0.7, 'Start', c_success, c_white, 9, bold=True)

    _box(ax, order[0], order[1], bw * 1.1, bh, 'Buyer Places\nOrder', c_primary, c_white, 8)
    _arrow(ax, start[0], start[1] - bh * 0.35, order[0], order[1] + bh / 2 + 0.05, c_muted)

    _box(ax, confirm[0], confirm[1], bw * 1.0, bh, 'Farmer\nConfirms Order', c_primary, c_white, 8)
    _arrow(ax, order[0], order[1] - bh / 2 - 0.05, confirm[0], confirm[1] + bh / 2 + 0.05, c_muted)

    _box(ax, sort[0], sort[1], bw * 1.3, bh, 'Sort by Shelf Life\n(Perishable First)', c_primary, c_white, 8)
    _arrow(ax, confirm[0], confirm[1] - bh / 2 - 0.05, sort[0], sort[1] + bh / 2 + 0.05, c_muted)

    _box(ax, allocate[0], allocate[1], bw * 1.3, bh, 'Allocate to Days\n(Max 5/day)', c_primary, c_white, 8)
    _arrow(ax, sort[0], sort[1] - bh / 2 - 0.05, allocate[0], allocate[1] + bh / 2 + 0.05, c_muted)

    _box(ax, assign[0], assign[1], bw * 1.4, bh, 'Assign Nearest\nWarehouse + Transporter', c_primary, c_white, 8)
    _arrow(ax, allocate[0], allocate[1] - bh / 2 - 0.05, assign[0], assign[1] + bh / 2 + 0.05, c_muted)

    _box(ax, notify[0], notify[1], bw * 1.0, bh, 'Notify All\nParticipants', c_warning, c_white, 8)
    _arrow(ax, assign[0], assign[1] - bh / 2 - 0.05, notify[0], notify[1] + bh / 2 + 0.05, c_muted)

    _box(ax, deliver[0], deliver[1], bw * 1.3, bh, 'Delivery Workflow\nPickup → Transit → Deliver', c_primary, c_white, 8)
    _arrow(ax, notify[0], notify[1] - bh / 2 - 0.05, deliver[0], deliver[1] + bh / 2 + 0.05, c_muted)

    _box(ax, complete[0], complete[1], bw * 0.9, bh, 'Mark\nDelivered', c_success, c_white, 8, bold=True)
    _arrow(ax, deliver[0], deliver[1] - bh / 2 - 0.05, complete[0], complete[1] + bh / 2 + 0.05, c_muted)

    # Side note: Forecasting runs in parallel
    ax.text(9.2, 12.0, 'Demand Forecasting\nruns in parallel\nfrom order history', fontsize=6.5,
            color=c_muted, ha='right', va='top',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#f1f5f9', edgecolor=c_muted, linewidth=0.5))
    _arrow(ax, 9.0, 12.7, 7.5, 12.7, c_muted, lw=0.8)

    ax.text(9.2, 3.0, 'Shelf-life tracking\nmonitors inventory\ncontinuously', fontsize=6.5,
            color=c_muted, ha='right', va='top',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#f1f5f9', edgecolor=c_muted, linewidth=0.5))
    _arrow(ax, 9.0, 3.7, 7.5, 3.7, c_muted, lw=0.8)

    plt.tight_layout()
    fig.savefig(output_path, dpi=200, bbox_inches='tight', facecolor='#ffffff')
    plt.close(fig)
    print('saved', output_path)


if __name__ == '__main__':
    generate(r'c:\Users\ALEXIS\Desktop\SENPAI\shots\agriflow\scheduler_flowchart.png')
